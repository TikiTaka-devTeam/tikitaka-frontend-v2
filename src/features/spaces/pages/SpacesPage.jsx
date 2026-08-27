import { useMemo, useState } from 'react';

import SpaceCard from '../components/SpaceCard';
import SpaceEmptyState from '../components/SpaceEmptyState';

import '../styles/spaces.css';

function SpacesPage() {
  const [selectedTab, setSelectedTab] = useState('active');

  /*
    API 연결 전에는 빈 배열.
    나중에 백엔드에서 조회한 실제 Space 데이터만 여기에 저장.
  */
  const [spaces, setSpaces] = useState([]);

  const visibleSpaces = useMemo(() => {
    return spaces.filter((space) => {
      if (selectedTab === 'active') {
        return !space.archived;
      }

      return space.archived;
    });
  }, [spaces, selectedTab]);

  const handleArchive = (spaceId) => {
    /*
      TODO:
      Space 보관 API 연결 후
      성공했을 때 목록 다시 조회
    */

    console.log('Space 보관:', spaceId);
  };

  const handleActivate = (spaceId) => {
    /*
      TODO:
      Space 활성화 API 연결 후
      성공했을 때 목록 다시 조회
    */

    console.log('Space 활성화:', spaceId);
  };

  const handleEdit = (spaceId) => {
    /*
      TODO:
      Space 수정 모달 연결
    */

    console.log('Space 수정:', spaceId);
  };

  const handleDelete = (spaceId) => {
    /*
      TODO:
      Space 삭제 API 연결 후
      성공했을 때 목록 다시 조회
    */

    console.log('Space 삭제:', spaceId);
  };

  const handleAddSpace = () => {
    /*
      TODO:
      Add Space 모달 연결
    */

    console.log('Add Space');
  };

  return (
    <main className="spaces-page">
      <div className="spaces-layout">
        <div className="spaces-toolbar">
          <div className="spaces-toolbar__left">
            <h1 className="spaces-title">
              Space 목록
            </h1>

            <div
              className="spaces-tabs"
              role="tablist"
              aria-label="Space 상태"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedTab === 'active'}
                className={`spaces-tab ${
                  selectedTab === 'active'
                    ? 'spaces-tab--selected'
                    : ''
                }`}
                onClick={() => setSelectedTab('active')}
              >
                활성화
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedTab === 'archived'}
                className={`spaces-tab ${
                  selectedTab === 'archived'
                    ? 'spaces-tab--selected'
                    : ''
                }`}
                onClick={() => setSelectedTab('archived')}
              >
                보관됨
              </button>
            </div>
          </div>

          <button
            type="button"
            className="add-space-button"
            onClick={handleAddSpace}
          >
            Add Space
          </button>
        </div>

        {visibleSpaces.length > 0 && (
          <div className="space-grid">
            {visibleSpaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                onArchive={handleArchive}
                onActivate={handleActivate}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {visibleSpaces.length === 0 && (
        <SpaceEmptyState />
      )}
    </main>
  );
}

export default SpacesPage;