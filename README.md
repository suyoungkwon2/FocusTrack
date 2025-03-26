# FocusTrack

KAIST x CMU LSMA Project  
Michelle Sohn, Mel Kwon

## 프로젝트 소개

FocusTrack은 AI 기반 브라우징 분석 및 생산성 향상 도구입니다. 웹 브라우징 습관을 분석하여 생산성을 높이고 집중력을 향상시키는 데 도움을 주는 크롬 확장 프로그램입니다.

### 주요 기능

- **브라우징 습관 추적**: 방문한 웹사이트와 체류 시간을 기록하고 분석합니다.
- **생산성 분석**: 카테고리별 사용 시간 분석을 통해 디지털 활동을 최적화합니다.
- **집중력 모니터링**: 집중 점수와 집중 시간을 측정하여 생산성 향상을 돕습니다.
- **맞춤형 인사이트**: 사용자별 맞춤형 생산성 향상 조언을 제공합니다.

## 설치 방법

### 개발자 모드로 설치

1. 이 저장소를 클론하거나 ZIP 파일로 다운로드합니다.
   ```
   git clone https://github.com/suyoungkwon2/FocusTrack.git
   ```

2. 크롬 브라우저에서 `chrome://extensions/` 페이지로 이동합니다.

3. 우측 상단의 "개발자 모드"를 활성화합니다.

4. "압축해제된 확장 프로그램 로드" 버튼을 클릭하고 클론한 폴더를 선택합니다.

5. FocusTrack이 확장 프로그램 목록에 추가되었는지 확인합니다.

## 사용 방법

1. 크롬 브라우저 우측 상단의 FocusTrack 아이콘을 클릭하여 팝업을 엽니다.

2. 오늘의 활동 및 집중 점수를 확인할 수 있습니다.

3. "View Analytics" 버튼을 클릭하여 상세 분석 페이지를 열어볼 수 있습니다.

4. "Start Focus Mode" 버튼을 클릭하여 집중 모드를 시작합니다.

## 개발 정보

### 기술 스택

- HTML/CSS/JavaScript
- Chrome Extensions API
- 로컬 스토리지 및 브라우저 액티비티 추적

### 프로젝트 구조

```
FocusTrack/
├── manifest.json       # 확장 프로그램 설정 파일
├── background.js       # 백그라운드 스크립트
├── popup.html          # 팝업 UI
├── popup.js            # 팝업 스크립트
├── popup.css           # 팝업 스타일
├── analytics.html      # 분석 페이지
├── analytics.js        # 분석 스크립트
└── images/             # 아이콘 및 이미지 파일
```

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 기여하기

이슈를 제출하거나 풀 리퀘스트를 통해 프로젝트에 기여할 수 있습니다. 모든 피드백과 기여를 환영합니다!
