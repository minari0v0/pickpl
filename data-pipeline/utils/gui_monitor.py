import os
import time
import logging
import tkinter as tk
from tkinter import ttk
from tkinter import scrolledtext

logger = logging.getLogger(__name__)

class TkinterLogHandler(logging.Handler):
    """
    Python 표준 로깅 시스템의 이벤트를 수신하여 
    Tkinter ScrolledText 위젯에 실시간으로 로그를 밀어주는 커스텀 핸들러 (Thread-Safe).
    """
    def __init__(self, text_widget: scrolledtext.ScrolledText):
        super().__init__()
        self.text_widget = text_widget
        
        # 로그 등급별 전용 색상 스타일 정의 (일관되게 Consolas 폰트 유지하여 가로 폭 정렬 깨짐 방지)
        self.text_widget.tag_config("INFO", foreground="#191F28")
        self.text_widget.tag_config("WARNING", foreground="#B38000", font=("Consolas", 10, "bold"))
        self.text_widget.tag_config("ERROR", foreground="#E65C00", font=("Consolas", 10, "bold"))
        self.text_widget.tag_config("CRITICAL", foreground="#D32F2F", font=("Consolas", 10, "bold"))

    def emit(self, record):
        try:
            msg = self.format(record)
            tag = record.levelname
            if tag not in ["INFO", "WARNING", "ERROR", "CRITICAL"]:
                tag = "INFO"
                
            # UI 스레드 안전하게 after()를 통해 전송하여 출력
            if self.text_widget.winfo_exists():
                self.text_widget.after(0, self._safe_write_log, msg, tag)
        except Exception:
            pass

    def _safe_write_log(self, msg, tag):
        try:
            self.text_widget.configure(state='normal')
            self.text_widget.insert('end', msg + '\n', tag)
            self.text_widget.configure(state='disabled')
            self.text_widget.yview('end')
        except Exception:
            pass

class GuiMonitor:
    """
    데이터 수집, AI 분석, 백엔드 적재 전반에서 
    공통으로 활용하는 실시간 윈도우 프로그레스 & 로그 팝업 모니터 대시보드 (스레드 분리 버전).
    """
    def __init__(self, title: str, task_name: str, total_steps: int):
        self.title = title
        self.task_name = task_name
        self.total_steps = max(total_steps, 1)
        self.root = None
        self.progress_bar = None
        self.status_label = None
        self.log_text = None
        self.close_btn = None
        self.log_handler = None
        self.is_closed = False
        self.worker_thread = None

        self._initialize_ui()

    def _initialize_ui(self):
        try:
            self.root = tk.Tk()
            self.root.title(self.title)
            self.root.geometry("680x480")
            self.root.resizable(False, False)
            
            # 윈도우 창을 모니터 화면 중앙에 배치
            window_width = 680
            window_height = 480
            screen_width = self.root.winfo_screenwidth()
            screen_height = self.root.winfo_screenheight()
            center_x = int(screen_width / 2 - window_width / 2)
            center_y = int(screen_height / 2 - window_height / 2)
            self.root.geometry(f"{window_width}x{window_height}+{center_x}+{center_y}")

            # 창 닫기 버튼(X) 이벤트 핸들링 바인딩
            self.root.protocol("WM_DELETE_WINDOW", self.on_window_close)

            # --- 1. 상단 정보 영역 (헤더 & 게이지) ---
            top_frame = tk.Frame(self.root, bg="#F0F6F5", padx=15, pady=12)
            top_frame.pack(fill="x")

            self.status_label = tk.Label(
                top_frame, 
                text=f"{self.task_name} 준비 중...", 
                font=("맑은 고딕", 11, "bold"), 
                fg="#2E7D7A", 
                bg="#F0F6F5",
                anchor="w"
            )
            self.status_label.pack(fill="x", pady=(0, 8))

            # 클램 테마 스타일로 게이지바 디자인 커스터마이징
            style = ttk.Style()
            style.theme_use('clam')
            style.configure(
                "Custom.Horizontal.TProgressbar", 
                thickness=18, 
                troughcolor='#E5ECEB', 
                bordercolor='#2E7D7A', 
                background='#2E7D7A'
            )

            self.progress_bar = ttk.Progressbar(
                top_frame, 
                style="Custom.Horizontal.TProgressbar", 
                orient="horizontal", 
                mode="determinate"
            )
            self.progress_bar.pack(fill="x")
            self.progress_bar['maximum'] = self.total_steps
            self.progress_bar['value'] = 0

            # --- 2. 중단 실시간 로그 영역 ---
            log_frame = tk.Frame(self.root, padx=15, pady=10)
            log_frame.pack(fill="both", expand=True)

            log_label = tk.Label(log_frame, text="📄 실시간 실행 로그", font=("맑은 고딕", 9, "bold"), fg="#7F776F")
            log_label.pack(anchor="w", pady=(0, 4))

            self.log_text = scrolledtext.ScrolledText(
                log_frame, 
                font=("Consolas", 10), 
                bg="#FAF9F6", 
                fg="#191F28",
                state="disabled",
                wrap="word"
            )
            self.log_text.pack(fill="both", expand=True)

            # --- 3. 하단 컨트롤 영역 (확인 버튼) ---
            bottom_frame = tk.Frame(self.root, padx=15, pady=10)
            bottom_frame.pack(fill="x")

            self.close_btn = ttk.Button(
                bottom_frame, 
                text="작업 중단", 
                command=self.on_window_close
            )
            self.close_btn.pack(side="right")

            # 파이썬 로깅 핸들러 등록 연동
            self.log_handler = TkinterLogHandler(self.log_text)
            self.log_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"))
            logging.getLogger().addHandler(self.log_handler)

        except Exception as e:
            logger.warning(f"통합 GUI 모니터 팝업 창 생성 실패 (텍스트 모드로 단독 수행): {e}")
            self.root = None

    def set_worker_thread(self, thread):
        """백그라운드에서 연산을 처리할 워커 스레드를 주입받음"""
        self.worker_thread = thread

    def start_loop(self):
        """워커 스레드를 가동하고 메인 Tkinter 이벤트 루프를 무중단 실행 (얼어붙음 방지)"""
        if self.root:
            if self.worker_thread:
                self.worker_thread.start()
            try:
                self.root.mainloop()
            except Exception:
                pass

    def refresh(self):
        """호환성을 위한 빈 함수"""
        pass

    def update_progress(self, current_step: int, status_text: str = None):
        """스레드 세이프하게 진행 상태 위젯을 업데이트"""
        if not self.root or self.is_closed:
            return
        try:
            if self.root.winfo_exists():
                self.root.after(0, self._update_progress_safe, current_step, status_text)
        except Exception:
            pass

    def _update_progress_safe(self, current_step: int, status_text: str):
        try:
            current_step = min(current_step, self.total_steps)
            percent = int((current_step / self.total_steps) * 100)
            
            if status_text:
                self.status_label['text'] = status_text
            else:
                self.status_label['text'] = f"{self.task_name} 진행 중: {current_step} / {self.total_steps} ({percent}%)"
                
            self.progress_bar['value'] = current_step
        except Exception:
            pass

    def on_window_close(self):
        """사용자가 창을 닫거나 중단 버튼을 클릭했을 때의 이벤트 처리"""
        self.is_closed = True
        if self.log_handler:
            logging.getLogger().removeHandler(self.log_handler)
        try:
            self.root.destroy()
        except Exception:
            pass
        logger.info("❌ 사용자에 의해 GUI 창이 닫혔거나 작업이 중단되었습니다.")
        os._exit(1)

    def finish(self, success: bool = True, final_message: str = None):
        """작업 완료 시 호출하여 상태를 마무리하고 확인 버튼 대기 흐름으로 전환 (Thread-Safe)"""
        if not self.root or self.is_closed:
            return
        try:
            if self.root.winfo_exists():
                self.root.after(0, self._finish_safe, success, final_message)
        except Exception:
            pass

    def _finish_safe(self, success: bool, final_message: str):
        try:
            if self.log_handler:
                logging.getLogger().removeHandler(self.log_handler)
                
            if success:
                self.status_label['text'] = final_message or f"🎉 {self.task_name}이(가) 완전히 완료되었습니다!"
                self.status_label['fg'] = "#2E7D7A"
                self.progress_bar['value'] = self.total_steps
                self.close_btn.configure(text="확인 (닫기)", command=self.close_gracefully)
                logger.info("🎉 모든 파이프라인 처리가 성공적으로 종료되었습니다.")
            else:
                self.status_label['text'] = final_message or f"⚠️ {self.task_name} 중 에러가 발생하여 정지되었습니다."
                self.status_label['fg'] = "#E65C00"
                self.close_btn.configure(text="종료", command=self.close_gracefully)
                logger.error("⚠️ 오류가 발생하여 파이프라인이 조기 중단되었습니다. 로그를 확인하세요.")
            
            self.root.bell()
        except Exception:
            pass

    def close_gracefully(self):
        self.is_closed = True
        try:
            self.root.destroy()
        except Exception:
            pass
