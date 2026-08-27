import { useNavigate } from "react-router-dom";
import logoSrc from "../../../assets/images/logo_tikitaka_blue.svg";
import { BottomNavigation, SearchToolbar } from "../../../components/common/AppToolbars.jsx";
import { SystemStatusBar } from "../../dashboard/components/DashboardChrome.jsx";
import "../styles/search.css";

const EMPTY_SECTIONS = [
  { title: "최근 검색어", empty: "최근 검색어가 존재하지 않습니다.", modifier: "queries" },
  { title: "최근 열어본 강의자료", empty: "최근 열어본 강의자료가 존재하지 않습니다.", modifier: "materials" },
  { title: "최근 열어본 질문", empty: "최근 열어본 질문이 존재하지 않습니다.", modifier: "questions" },
];
function SearchPage() { const navigate = useNavigate(); return <main className="search-page">
  <div className="search-page__orb search-page__orb--middle" aria-hidden="true" /><div className="search-page__orb search-page__orb--top" aria-hidden="true" /><div className="search-page__orb search-page__orb--bottom" aria-hidden="true" />
  <SystemStatusBar /><SearchToolbar /><BottomNavigation />
  <header className="search-page__brand"><button type="button" onClick={() => navigate("/dashboard")} aria-label="대시보드로 이동"><img src={logoSrc} alt="tikitaka" /></button></header>
  <div className="search-page__content">{EMPTY_SECTIONS.map(({ title, empty, modifier }, index) => <section className={`search-empty search-empty--${modifier}`} key={title}><header><h1>{title}</h1>{index === 0 && <button type="button">전체 삭제</button>}</header><p>{empty}</p></section>)}</div>
</main>; }
export default SearchPage;
