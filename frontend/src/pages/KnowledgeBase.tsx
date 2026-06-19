import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import { knowledgeBaseAPI, KnowledgeBaseSubject, KnowledgeBaseSubjectDetail, KnowledgeBaseSearchResult, KnowledgeBaseCategory, KnowledgeBaseStats } from '@/api';

type ViewMode = 'grid' | 'search' | 'detail';

const KnowledgeBase: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [subjects, setSubjects] = useState<KnowledgeBaseSubject[]>([]);
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([]);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<KnowledgeBaseSubjectDetail | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeBaseSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载知识库概览
  const loadIndex = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await knowledgeBaseAPI.getIndex();
      setSubjects(data.subjects || []);
      setCategories(data.categories || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || '加载知识库失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载学科详情
  const loadSubjectDetail = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await knowledgeBaseAPI.getSubjectDetail(id);
      setSelectedSubject(data);
      setViewMode('detail');
    } catch (err: any) {
      setError(err.message || '加载学科详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索知识库
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setViewMode('grid');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await knowledgeBaseAPI.search(searchKeyword);
      setSearchResults(data.results || []);
      setViewMode('search');
    } catch (err: any) {
      setError(err.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    setViewMode('grid');
    setSelectedSubject(null);
    setSearchResults([]);
    setSearchKeyword('');
  };

  useEffect(() => {
    loadIndex();
  }, [loadIndex]);

  // 过滤学科
  const filteredSubjects = selectedCategory
    ? subjects.filter(s => s.category === selectedCategory)
    : subjects;

  // 获取分类颜色
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      '总纲': 'bg-purple-100 text-purple-800 border-purple-200',
      '语言与文学': 'bg-blue-100 text-blue-800 border-blue-200',
      '数理与逻辑': 'bg-green-100 text-green-800 border-green-200',
      '人文与社会': 'bg-orange-100 text-orange-800 border-orange-200',
      '科学与技术': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      '体育与艺术': 'bg-pink-100 text-pink-800 border-pink-200',
      '综合实践': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // 获取学科图标
  const getSubjectIcon = (name: string) => {
    const icons: Record<string, string> = {
      '课程方案': '📋', '语文': '📖', '数学': '🔢', '英语': '🌍',
      '物理': '⚡', '化学': '🧪', '生物学': '🧬', '历史': '📜',
      '地理': '🗺️', '道德与法治': '⚖️', '科学': '🔬', '体育与健康': '⚽',
      '艺术': '🎨', '信息科技': '💻', '劳动': '🔧', '俄语': '🇷🇺', '日语': '🇯🇵',
    };
    return icons[name] || '📚';
  };

  return (
    <Layout
      title="📚 新课标知识库"
      subtitle="义务教育课程标准（2022年版）"
      breadcrumbs={[
        { label: '首页', path: '/dashboard' },
        { label: '新课标知识库' },
        ...(viewMode === 'detail' && selectedSubject ? [{ label: selectedSubject.name }] : []),
        ...(viewMode === 'search' ? [{ label: `搜索: ${searchKeyword}` }] : []),
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 网格视图 */}
        {viewMode === 'grid' && (
          <>
            {/* 统计信息 */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-primary-600">{stats.totalSubjects}</div>
                  <div className="text-sm text-gray-500">学科总数</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-primary-500">{stats.totalSections}</div>
                  <div className="text-sm text-gray-500">知识章节</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-primary-700">{stats.totalKeywords}</div>
                  <div className="text-sm text-gray-500">关键词</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="text-2xl font-bold text-primary-400">{Object.keys(stats.categories).length}</div>
                  <div className="text-sm text-gray-500">学科分类</div>
                </div>
              </div>
            )}

            {/* 分类筛选 + 搜索框 */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {viewMode !== 'grid' && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full border border-gray-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回列表
                </button>
              )}
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {/* 搜索框 */}
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="搜索知识库..."
                    className="w-48 px-3 py-1.5 pl-8 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleSearch}
                  className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-full hover:bg-primary-600 transition-colors"
                >
                  搜索
                </button>
              </div>
            </div>

            {/* 学科卡片网格 */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    onClick={() => loadSubjectDetail(subject.id)}
                    className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{getSubjectIcon(subject.name)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {subject.name}
                        </h3>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(subject.category)}`}>
                          {subject.category}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{subject.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(subject.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                      {(subject.tags || []).length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          +{(subject.tags || []).length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 搜索结果视图 */}
        {viewMode === 'search' && (
          <div>
            <div className="mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg border border-gray-300 transition-colors mb-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回知识库
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                搜索结果："{searchKeyword}"（共 {searchResults.length} 个学科匹配）
              </h2>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500">未找到相关内容，请尝试其他关键词</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getSubjectIcon(result.name)}</span>
                      <div>
                        <h3
                          className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                          onClick={() => loadSubjectDetail(result.id)}
                        >
                          {result.fullName || result.name}
                        </h3>
                        <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(result.category)}`}>
                          {result.category}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {result.matchedSections.map((section, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-700">{section.title}</span>
                            <span className="px-1.5 py-0.5 text-xs bg-primary-100 text-primary-700 rounded">
                              {section.matchType === 'title' ? '标题匹配' : section.matchType === 'keyword' ? '关键词匹配' : '内容匹配'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{section.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 详情视图 */}
        {viewMode === 'detail' && selectedSubject && (
          <div>
            {/* 学科头部信息 */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回列表
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{getSubjectIcon(selectedSubject.name)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedSubject.fullName || selectedSubject.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(selectedSubject.category)}`}>
                      {selectedSubject.category}
                    </span>
                    {selectedSubject.pdfFile && (
                      <span className="text-xs text-gray-500">📄 {selectedSubject.pdfFile}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 核心素养 */}
            {selectedSubject.coreCompetencies && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  {selectedSubject.coreCompetencies.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSubject.coreCompetencies.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-2">{item.name}</h4>
                      <p className="text-sm text-blue-700">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 知识章节 */}
            {selectedSubject.sections && selectedSubject.sections.length > 0 && (
              <div className="space-y-4">
                {selectedSubject.sections.map((section) => (
                  <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {section.title}
                    </h3>
                    <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {section.content}
                    </div>
                    {section.keywords && section.keywords.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {section.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            onClick={() => {
                              setSearchKeyword(keyword);
                              handleSearch();
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KnowledgeBase;
