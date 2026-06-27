package com.pickpl.app.visit.service;

import com.pickpl.app.domain.place.Place;
import com.pickpl.app.domain.place.PlaceRepository;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.domain.visit.VisitRecord;
import com.pickpl.app.domain.visit.VisitRecordRepository;
import com.pickpl.app.visit.dto.AdminVisitResponse;
import com.pickpl.app.visit.dto.VisitRecordRequest;
import com.pickpl.app.visit.dto.VisitRecordResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VisitService {

    private final VisitRecordRepository visitRecordRepository;
    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;

    public VisitService(VisitRecordRepository visitRecordRepository, PlaceRepository placeRepository, UserRepository userRepository) {
        this.visitRecordRepository = visitRecordRepository;
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
    }

    public void addVisitRecord(Long userId, VisitRecordRequest request) {
        if (!placeRepository.existsById(request.getPlaceId())) {
            throw new IllegalArgumentException("존재하지 않는 장소입니다: " + request.getPlaceId());
        }
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("존재하지 않는 유저입니다: " + userId);
        }

        VisitRecord visitRecord = new VisitRecord(userId, request.getPlaceId(), request.getComment(), request.getVisitedDate());
        visitRecordRepository.save(visitRecord);
    }

    @Transactional(readOnly = true)
    public List<VisitRecordResponse> getVisitRecords(Long placeId, Long currentUserId) {
        return visitRecordRepository.findByPlaceIdOrderByVisitedDateDesc(placeId).stream()
                .map(record -> {
                    User user = userRepository.findById(record.getUserId()).orElse(null);
                    String nickname = (user != null) ? user.getNickname() : "알 수 없는 유저";
                    String profileImageUrl = (user != null) ? user.getProfileImageUrl() : "";
                    boolean isMyRecord = record.getUserId().equals(currentUserId);
                    return new VisitRecordResponse(
                            record.getId(),
                            record.getUserId(),
                            nickname,
                            profileImageUrl,
                            record.getComment(),
                            record.getVisitedDate(),
                            isMyRecord,
                            record.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    public void updateVisitRecord(Long userId, Long visitId, VisitRecordRequest request) {
        VisitRecord record = visitRecordRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방문 기록입니다: " + visitId));

        if (!record.getUserId().equals(userId)) {
            throw new SecurityException("방문 기록을 수정할 권한이 없습니다.");
        }

        record.update(request.getComment(), request.getVisitedDate());
    }

    public void deleteVisitRecord(Long userId, Long visitId) {
        VisitRecord record = visitRecordRepository.findById(visitId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 방문 기록입니다: " + visitId));

        if (!record.getUserId().equals(userId)) {
            throw new SecurityException("방문 기록을 삭제할 권한이 없습니다.");
        }

        visitRecordRepository.delete(record);
    }

    @Transactional(readOnly = true)
    public Page<AdminVisitResponse> getAllVisitsForAdmin(Pageable pageable) {
        return visitRecordRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(record -> {
                    User user = userRepository.findById(record.getUserId()).orElse(null);
                    String nickname = (user != null) ? user.getNickname() : "알 수 없는 유저";

                    Place place = placeRepository.findById(record.getPlaceId()).orElse(null);
                    String placeName = (place != null) ? place.getName() : "삭제된 장소 (ID: " + record.getPlaceId() + ")";

                    return new AdminVisitResponse(
                            record.getId(),
                            record.getUserId(),
                            nickname,
                            record.getPlaceId(),
                            placeName,
                            record.getComment(),
                            record.getVisitedDate(),
                            record.getCreatedAt()
                    );
                });
    }

    public void deleteVisitRecordForAdmin(Long visitId) {
        if (!visitRecordRepository.existsById(visitId)) {
            throw new IllegalArgumentException("존재하지 않는 방문 기록입니다: " + visitId);
        }
        visitRecordRepository.deleteById(visitId);
    }
}
