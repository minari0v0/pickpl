package com.pickpl.app.visit;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.domain.visit.VisitRecord;
import com.pickpl.app.domain.visit.VisitRecordRepository;
import com.pickpl.app.visit.dto.AdminVisitResponse;
import com.pickpl.app.visit.dto.VisitRecordRequest;
import com.pickpl.app.visit.dto.VisitRecordResponse;
import com.pickpl.app.visit.service.VisitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitServiceTest {

    @Mock
    private VisitRecordRepository visitRecordRepository;

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private VisitService visitService;

    @Test
    @DisplayName("방문 기록 등록 성공")
    void addVisitRecord_Success() {
        // given
        Long userId = 1L;
        Long placeId = 10L;
        VisitRecordRequest request = new VisitRecordRequest(placeId, "좋은 장소네요!", LocalDate.of(2026, 6, 28));

        when(placeRepository.existsById(placeId)).thenReturn(true);
        when(userRepository.existsById(userId)).thenReturn(true);

        // when
        visitService.addVisitRecord(userId, request);

        // then
        verify(visitRecordRepository, times(1)).save(any(VisitRecord.class));
    }

    @Test
    @DisplayName("방문 기록 등록 실패 - 존재하지 않는 장소")
    void addVisitRecord_PlaceNotFound() {
        // given
        Long userId = 1L;
        Long placeId = 10L;
        VisitRecordRequest request = new VisitRecordRequest(placeId, "좋은 장소네요!", LocalDate.of(2026, 6, 28));

        when(placeRepository.existsById(placeId)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> visitService.addVisitRecord(userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 장소입니다");
    }

    @Test
    @DisplayName("장소별 방문 기록 조회 - 작성자 정보 매핑 및 본인 여부 확인")
    void getVisitRecords_Success() {
        // given
        Long placeId = 10L;
        Long currentUserId = 1L;
        Long otherUserId = 2L;

        VisitRecord myRecord = new VisitRecord(currentUserId, placeId, "내가 쓴 후기", LocalDate.of(2026, 6, 28));
        VisitRecord otherRecord = new VisitRecord(otherUserId, placeId, "남이 쓴 후기", LocalDate.of(2026, 6, 27));

        User me = User.builder().nickname("나").profileImageUrl("my-pic.png").role(Role.USER).build();
        User other = User.builder().nickname("타인").profileImageUrl("other-pic.png").role(Role.USER).build();

        when(visitRecordRepository.findByPlaceIdOrderByVisitedDateDesc(placeId))
                .thenReturn(Arrays.asList(myRecord, otherRecord));
        when(userRepository.findById(currentUserId)).thenReturn(Optional.of(me));
        when(userRepository.findById(otherUserId)).thenReturn(Optional.of(other));

        // when
        List<VisitRecordResponse> result = visitService.getVisitRecords(placeId, currentUserId);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getNickname()).isEqualTo("나");
        assertThat(result.get(0).isIsMyRecord()).isTrue();
        assertThat(result.get(1).getNickname()).isEqualTo("타인");
        assertThat(result.get(1).isIsMyRecord()).isFalse();
    }

    @Test
    @DisplayName("방문 기록 수정 성공")
    void updateVisitRecord_Success() {
        // given
        Long userId = 1L;
        Long visitId = 100L;
        VisitRecord record = new VisitRecord(userId, 10L, "이전 한줄평", LocalDate.of(2026, 6, 27));
        VisitRecordRequest updateRequest = new VisitRecordRequest(10L, "수정된 한줄평", LocalDate.of(2026, 6, 28));

        when(visitRecordRepository.findById(visitId)).thenReturn(Optional.of(record));

        // when
        visitService.updateVisitRecord(userId, visitId, updateRequest);

        // then
        assertThat(record.getComment()).isEqualTo("수정된 한줄평");
        assertThat(record.getVisitedDate()).isEqualTo(LocalDate.of(2026, 6, 28));
    }

    @Test
    @DisplayName("방문 기록 수정 실패 - 타인 기록 수정 제한")
    void updateVisitRecord_Forbidden() {
        // given
        Long userId = 1L;
        Long otherUserId = 2L;
        Long visitId = 100L;
        VisitRecord record = new VisitRecord(otherUserId, 10L, "타인 한줄평", LocalDate.of(2026, 6, 27));
        VisitRecordRequest updateRequest = new VisitRecordRequest(10L, "수정 시도", LocalDate.of(2026, 6, 28));

        when(visitRecordRepository.findById(visitId)).thenReturn(Optional.of(record));

        // when & then
        assertThatThrownBy(() -> visitService.updateVisitRecord(userId, visitId, updateRequest))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("수정할 권한이 없습니다");
    }

    @Test
    @DisplayName("방문 기록 삭제 성공")
    void deleteVisitRecord_Success() {
        // given
        Long userId = 1L;
        Long visitId = 100L;
        VisitRecord record = new VisitRecord(userId, 10L, "한줄평", LocalDate.of(2026, 6, 27));

        when(visitRecordRepository.findById(visitId)).thenReturn(Optional.of(record));

        // when
        visitService.deleteVisitRecord(userId, visitId);

        // then
        verify(visitRecordRepository, times(1)).delete(record);
    }

    @Test
    @DisplayName("관리자용 전체 방문 기록 페이징 조회 - 삭제된 장소 예외 처리 포함")
    void getAllVisitsForAdmin_Success() {
        // given
        Pageable pageable = PageRequest.of(0, 10);
        VisitRecord record1 = new VisitRecord(1L, 10L, "후기1", LocalDate.of(2026, 6, 28));
        VisitRecord record2 = new VisitRecord(2L, 20L, "후기2", LocalDate.of(2026, 6, 27));
        Page<VisitRecord> page = new PageImpl<>(Arrays.asList(record1, record2), pageable, 2);

        User user1 = User.builder().nickname("유저1").role(Role.USER).build();
        Place place1 = new Place("실존장소", "thumb.png", "ext-1", "서울시 성동구", 37.0, 127.0, "카페");

        when(visitRecordRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userRepository.findById(2L)).thenReturn(Optional.empty()); // 유저 유실 케이스
        when(placeRepository.findById(10L)).thenReturn(Optional.of(place1));
        when(placeRepository.findById(20L)).thenReturn(Optional.empty()); // 장소 삭제 케이스

        // when
        Page<AdminVisitResponse> result = visitService.getAllVisitsForAdmin(pageable);

        // then
        assertThat(result).hasSize(2);
        assertThat(result.getContent().get(0).getNickname()).isEqualTo("유저1");
        assertThat(result.getContent().get(0).getPlaceName()).isEqualTo("실존장소");
        
        // 삭제된 장소/유저 방어 처리 검증
        assertThat(result.getContent().get(1).getNickname()).isEqualTo("알 수 없는 유저");
        assertThat(result.getContent().get(1).getPlaceName()).isEqualTo("삭제된 장소 (ID: 20)");
    }

    @Test
    @DisplayName("관리자 방문 기록 강제 삭제 성공")
    void deleteVisitRecordForAdmin_Success() {
        // given
        Long visitId = 100L;
        when(visitRecordRepository.existsById(visitId)).thenReturn(true);

        // when
        visitService.deleteVisitRecordForAdmin(visitId);

        // then
        verify(visitRecordRepository, times(1)).deleteById(visitId);
    }
}
