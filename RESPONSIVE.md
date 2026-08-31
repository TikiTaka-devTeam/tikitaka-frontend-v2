# RESPONSIVE.md : 프론트엔드 반응형 처리 방식

## 1. 기본 방향

현재 PC Figma 디자인은 **1210px 프레임**, 실제 주요 콘텐츠 영역은 **1130px**을 기준으로 한다.

반응형 처리는 아래 방식으로 통일한다.

> **공통 중앙 컨테이너 + Grid/Flex + 필요한 부분만 clamp + breakpoint**
> 

화면 전체를 단순 확대·축소하지 않고, 화면 너비가 줄어들면 **레이아웃 자체가 자연스럽게 재배치되는 방식**으로 구현한다.

---

## 2. 공통 페이지 구조

Dashboard, Spaces 및 앞으로 추가되는 주요 페이지는 아래 구조를 기본으로 사용한다.

```
<mainclassName="페이지명-page"><divclassName="app-frame"><BrandLogoclassName="app-brand"/><AppToolbars/><divclassName="app-container">
      페이지 콘텐츠</div></div></main>
```

역할은 다음과 같다.

| 영역 | 역할 |
| --- | --- |
| `app-frame` | 페이지 전체의 공통 기준 영역 |
| `app-brand` | 페이지 이동 시에도 동일한 위치에 표시되는 로고 |
| `AppToolbars` | 공통 상단/하단 네비게이션 |
| `app-container` | 실제 페이지별 콘텐츠 영역 |

---

## 3. 공통 레이아웃 기준

### `app-frame`

전체 페이지의 최대 기준 너비는 `1210px`이다.

```
.app-frame {
  position:relative;
  width:min(100%,var(--app-frame-max));
  min-height:100vh;
  min-height:100dvh;
  margin-inline:auto;
}
```

화면이 넓어져도 최대 `1210px`을 유지하며 중앙 정렬된다.

```
넓은 화면

             ┌────── 1210px ──────┐
             │                     │
             │     페이지 영역      │
             │                     │
             └─────────────────────┘
```

화면이 `1210px`보다 작아지면 브라우저 너비에 맞춰 자연스럽게 줄어든다.

---

### `app-container`

실제 주요 콘텐츠 최대 너비는 `1130px`이다.

```
.app-container {
  position:relative;
  width:min(calc(100%- (var(--app-gutter)*2)),var(--app-content-max)
  );
  margin-inline:auto;
}
```

PC Figma 기준은 다음과 같다.

```
1210px
= 40px
+ 1130px
+ 40px

┌─────────────────────────────────────┐
│ 40 │        CONTENT 1130        │ 40 │
└─────────────────────────────────────┘
```

---

## 4. 공통 전역 변수

페이지별로 동일한 너비와 여백 값을 반복하지 않고 `global.css`에서 관리한다.

```
:root {--app-frame-max:1210px;--app-content-max:1130px;--app-gutter:clamp(16px,3.3vw,40px);--app-logo-top:59px;
}
```

### 각 변수 역할

| 변수 | 역할 |
| --- | --- |
| `--app-frame-max` | 전체 페이지 최대 너비 |
| `--app-content-max` | 실제 콘텐츠 최대 너비 |
| `--app-gutter` | 화면 좌우 여백 |
| `--app-logo-top` | 공통 로고 Y 위치 |

새 페이지에서도 해당 변수를 그대로 사용한다.

---

# 5. 공통 로고 위치

Dashboard, Spaces 등 페이지를 이동할 때 로고가 움직이지 않도록 **페이지별 콘텐츠 구조와 분리하여 `app-frame` 기준으로 배치한다.**

```
.app-brand {
  position:absolute;
  top:var(--app-logo-top);
  left:var(--app-gutter);
  z-index:10;
}
```

사용:

```
<divclassName="app-frame"><BrandLogoclassName="app-brand"/><AppToolbars/><divclassName="app-container">
    페이지 콘텐츠</div></div>
```

따라서 로고를 아래처럼 페이지 내부 `header`에 따로 배치하지 않는다.

```
<header><BrandLogo/></header>
```

페이지마다 부모의 `padding`, `margin`, `header` 높이가 다를 수 있기 때문이다.

공통 UI는 가능한 한 **동일한 부모 + 동일한 공통 클래스**를 사용한다.

---

# 6. AppToolbars 위치

상단 Toolbar 역시 `app-frame` 안에 배치한다.

```
<divclassName="app-frame"><BrandLogoclassName="app-brand"/><AppToolbars/><divclassName="app-container">
    ...</div></div>
```

이를 통해 큰 모니터에서도 페이지 본문은 중앙에 있는데 Toolbar만 브라우저 오른쪽 끝으로 떨어지는 현상을 방지한다.

하단 Navigation은 화면 하단에 계속 보여야 하므로 `position: fixed`를 사용할 수 있다.

---

# 7. 일반 콘텐츠 반응형 처리

카드, 목록, 사이드바 등 일반적인 UI는 **Grid 또는 Flex**를 사용한다.

예를 들어 Space 목록의 PC 디자인은:

```
366 + 16 + 366 + 16 + 366
= 1130px
```

이므로 다음과 같이 구성한다.

```
.space-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:16px;
}
```

각 카드의 너비를 `366px`으로 강제로 고정하기보다 **1130px 영역을 3등분**한다.

---

## 8. 화면이 좁아질 경우

화면이 줄어들었을 때 카드나 글씨를 무조건 축소하지 않고 **컬럼 수를 변경한다.**

```
@media (max-width:900px) {
  .space-grid {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}@media (max-width:600px) {
  .space-grid {
    grid-template-columns:1fr;
  }
}
```

결과:

```
Desktop

[ Space ][ Space ][ Space ]

중간 화면

[ Space ][ Space ]
[ Space ][ Space ]

작은 화면

[ Space ]
[ Space ]
[ Space ]
```

---

# 9. Dashboard 처리 방식

PC에서는 시간표와 사이드 영역을 나란히 배치한다.

```
┌──────────────────── 1130px ───────────────────┐
│                                               │
│   시간표 영역        20px       Sidebar         │
│                                               │
└───────────────────────────────────────────────┘
```

```
.dashboard-content {
  display:grid;
  grid-template-columns:minmax(0,2.2fr)minmax(300px,1fr);
  gap:20px;
}
```

화면이 좁아지면 사이드 영역을 시간표 아래로 이동한다.

```
@media (max-width:900px) {
  .dashboard-content {
    grid-template-columns:1fr;
  }
}
```

더 좁아지면 Sidebar 내부 카드들도 세로로 배치한다.

즉 기본 원칙은:

```
PC
시간표 | Sidebar

↓

Tablet
시간표
Sidebar 카드 | Sidebar 카드

↓

좁은 화면
시간표
Sidebar 카드
Sidebar 카드
```

이다.

---

# 10. 좌표 기반 UI 처리

시간표처럼 내부 위치가 좌표에 의존하는 UI는 일반 카드와 다르게 처리한다.

예를 들어 Dashboard 시간표에는:

- 시간별 Y 좌표
- 요일별 X 좌표
- 강의 시작 시간
- 강의 길이
- Grid line

등 고정 좌표 계산이 존재한다.

따라서 내부 요소까지 무리하게 비율 축소하지 않고 시간표 자체는 기준 크기를 유지할 수 있다.

```
.dashboard-timetable {
  width:763px;
  height:568px;
}
```

부모보다 공간이 좁아졌을 때는 가로 스크롤을 허용한다.

```
.dashboard-timetable-scroll {
  width:100%;
  overflow-x:auto;
  overflow-y:hidden;
}
```

즉,

> **전체 페이지 레이아웃은 반응형으로 처리하되, 좌표 계산이 중요한 복잡한 컴포넌트는 내부 구조를 유지한다.**
> 

---

# 11. `clamp()` 사용 기준

모든 크기에 `clamp()`를 적용하지 않는다.

화면 크기에 따라 자연스럽게 변화해도 되는 요소에만 사용한다.

대표적으로 페이지 좌우 여백:

```
--app-gutter:clamp(16px, 3.3vw, 40px);
```

의 의미는:

```
작은 화면   → 최소 16px
중간 화면   → viewport에 따라 변화
큰 화면     → 최대 40px
```

이다.

로고처럼 크기가 어느 정도 유동적이어도 되는 요소에도 사용할 수 있다.

```
.brand-logoimg {
  width:clamp(112px,10.91vw,132px);
  height:auto;
}
```

반대로 정확한 크기를 유지해야 하는 버튼이나 특정 컴포넌트에는 꼭 사용할 필요가 없다.

---

# 12. 배경 장식 처리

Blur, 원형 gradient 등 **장식 요소가 브라우저 스크롤 영역을 늘리지 않도록** 실제 콘텐츠와 별도의 배경 레이어로 분리한다.

예:

```
<mainclassName="dashboard-page"><divclassName="dashboard-background"aria-hidden="true"><divclassName="dashboard-page__orb dashboard-page__orb--left"/><divclassName="dashboard-page__orb dashboard-page__orb--right"/></div><divclassName="app-frame">
    실제 콘텐츠</div></main>
```

CSS:

```
.dashboard-background {
  position:fixed;
  inset:0;
  overflow:hidden;
  pointer-events:none;
}
```

이렇게 하면 장식이 화면 밖으로 퍼져도 문서의 실제 높이가 증가하지 않는다.

### 중요한 점

페이지 전체에 아래처럼 강제로 처리하는 것은 지양한다.

```
.page {
  height:100vh;
  overflow:hidden;
}
```

실제 콘텐츠가 화면보다 길어졌을 때도 스크롤이 차단될 수 있기 때문이다.

페이지는 콘텐츠가 길어지면 **정상적으로 세로 스크롤이 가능해야 한다.**

---

# 13. 스크롤 처리 원칙

스크롤은 필요한 영역에만 적용한다.

| 상황 | 처리 |
| --- | --- |
| 일반 페이지 콘텐츠가 화면보다 길어짐 | 브라우저 기본 세로 스크롤 |
| 시간표처럼 내부 너비가 고정된 UI | 해당 컴포넌트에서 `overflow-x: auto` |
| 할 일 목록처럼 카드 내부 리스트 | 카드 내부 `overflow-y: auto` |
| 장식용 blur/orb | 별도 배경 레이어에서 `overflow: hidden` |
| 페이지 전체 | 불필요하게 `overflow: hidden` 사용하지 않음 |

---

# 14. Breakpoint 기준

현재 기본적인 breakpoint는 다음을 기준으로 사용한다.

| 범위 | 기본 처리 |
| --- | --- |
| `900px 초과` | PC 레이아웃 |
| `900px 이하` | 다중 컬럼 축소 또는 세로 재배치 |
| `700px 이하` | 주요 UI 세로 배치 강화 |
| `600px 이하` | 카드 1열 등 작은 화면 대응 |

단, 모든 페이지가 반드시 동일한 breakpoint를 사용할 필요는 없다.

컴포넌트가 실제로 깨지는 지점을 기준으로 조정하되, 특별한 이유가 없다면 기존 기준을 우선 사용한다.

---

# 15. 새 페이지 구현 시 기본 형태

앞으로 새로운 페이지를 만들 때는 아래 형태에서 시작한다.

```
functionExamplePage() {return (<mainclassName="example-page"><divclassName="app-frame"><BrandLogovariant="blue"className="app-brand"/><AppToolbars/><divclassName="app-container example-container">
          페이지 콘텐츠</div></div></main>
  );
}
```

그리고 페이지 CSS에서는 중앙정렬과 전체 너비를 다시 작성하지 않는다.

```
.example-page {
  min-height:100vh;
  background: #edf0f6;
}

.example-container {/* 해당 페이지에 필요한 위치/레이아웃만 작성 */
}
```

---

# 16. 공통 적용 규칙 요약

| 항목 | 처리 방식 |
| --- | --- |
| Figma PC 기준 | `1210px` |
| 실제 콘텐츠 최대 너비 | `1130px` |
| 좌우 여백 | `clamp(16px, 3.3vw, 40px)` |
| 전체 페이지 영역 | `app-frame` |
| 콘텐츠 영역 | `app-container` |
| 로고 위치 | `app-frame` 기준 `app-brand` 공통 사용 |
| 상단 Toolbar | `app-frame` 안에 배치 |
| 하단 Navigation | 필요 시 `position: fixed` |
| 일반 레이아웃 | Grid / Flex |
| 카드 목록 | breakpoint에 따라 컬럼 변경 |
| 크기 조절 | 필요한 요소에만 `clamp()` |
| 시간표 등 좌표 UI | 내부 기준 크기 유지 + 필요 시 스크롤 |
| 페이지 세로 스크롤 | 콘텐츠가 길어질 때 자연스럽게 허용 |
| 장식 배경 | 실제 콘텐츠와 레이어 분리 |
| 전체 `transform: scale()` | 사용하지 않음 |
| 모든 px 비율 계산 | 사용하지 않음 |

## 최종 정리

**1210px Figma 디자인을 PC 기준으로 유지하되, 화면이 좁아지면 디자인 전체를 축소하지 않고 Grid/Flex 및 breakpoint를 이용해 레이아웃을 재배치한다.**

모든 주요 페이지는 `app-frame`과 `app-container`를 공통으로 사용하며, 로고와 Toolbar처럼 페이지 간 동일하게 유지되어야 하는 UI는 페이지별 레이아웃에서 분리해 공통 기준으로 배치한다.

시간표처럼 좌표 계산이 중요한 컴포넌트는 내부 구조를 유지하고 필요한 경우 해당 영역에서만 스크롤을 사용하며, **장식 요소는 실제 페이지 크기나 스크롤에 영향을 주지 않도록 별도 레이어로 관리한다.**