import React, { useState, useEffect } from 'react';
import { commentAPI } from '@/api';
import type { CommentItem, CommentStats } from '@/api';
import { useAuth } from '@/context/AuthContext';

interface CommentSectionProps {
  resourceId?: number;
  portfolioId?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ resourceId, portfolioId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [stats, setStats] = useState<CommentStats>({ totalComments: 0, totalQuestions: 0, totalReviews: 0, totalDiscussions: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [repliesMap, setRepliesMap] = useState<Record<number, CommentItem[]>>({});

  const entityType = portfolioId ? 'portfolios' : 'resources';
  const entityId = portfolioId || resourceId;

  useEffect(() => {
    if (entityId) {
      fetchComments();
      fetchStats();
    }
  }, [entityId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const result = await commentAPI.list(entityType, entityId!, {
        page: 1,
        pageSize: 50,
      });
      setComments(result.comments || []);
    } catch (error) {
      console.error('获取评论失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await commentAPI.getStats(entityType, entityId!);
      setStats(result);
    } catch (error) {
      console.error('获取评论统计失败:', error);
    }
  };

  const fetchReplies = async (commentId: number) => {
    try {
      const result = await commentAPI.getReplies(commentId, { page: 1, pageSize: 50 });
      setRepliesMap(prev => ({ ...prev, [commentId]: result.replies || [] }));
    } catch (error) {
      console.error('获取回复失败:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await commentAPI.create(entityType, entityId!, {
        content: newComment.trim(),
        commentType: 'comment',
      });
      setNewComment('');
      fetchComments();
      fetchStats();
    } catch (error) {
      console.error('发表评论失败:', error);
      alert('发表失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      await commentAPI.create(entityType, entityId!, {
        content: replyContent.trim(),
        commentType: 'comment',
        parentId,
      });
      setReplyContent('');
      setReplyTo(null);
      fetchReplies(parentId);
      fetchStats();
    } catch (error) {
      console.error('回复失败:', error);
      alert('回复失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    try {
      await commentAPI.delete(commentId);
      fetchComments();
      fetchStats();
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('删除失败，请重试');
    }
  };

  const toggleReplies = async (commentId: number) => {
    if (expandedReplies.includes(commentId)) {
      setExpandedReplies(prev => prev.filter(id => id !== commentId));
    } else {
      setExpandedReplies(prev => [...prev, commentId]);
      if (!repliesMap[commentId]) {
        await fetchReplies(commentId);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* 标题 */}
      <div className="p-3 md:p-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800">
          评论区 <span className="text-sm font-normal text-gray-500">({stats.totalComments})</span>
        </h3>
      </div>

      {/* 发表评论区 */}
      {user && (
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {user.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="发表你的看法..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                rows={3}
              />
              <div className="flex items-center justify-end mt-3">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '发送中...' : '发表评论'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
          请先<a href="/login" className="text-pink-500 hover:underline">登录</a>后发表评论
        </div>
      )}

      {/* 评论列表 */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
            加载中...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-2">💭</div>
            <p>暂无评论，快来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">
                    {comment.userName?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{comment.userName}</span>
                    <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    {user && user.id === comment.userId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-auto"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>

                  {/* 操作栏 */}
                  <div className="flex items-center gap-4 mt-2">
                    {user && (
                      <button
                        onClick={() => {
                          setReplyTo(replyTo?.id === comment.id ? null : comment);
                          setReplyContent('');
                        }}
                        className="text-xs text-gray-500 hover:text-pink-500 transition-colors"
                      >
                        💬 回复
                      </button>
                    )}
                    {(comment.replyCount || 0) > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="text-xs text-pink-500 hover:text-pink-600 transition-colors"
                      >
                        {expandedReplies.includes(comment.id) ? '收起回复' : `查看回复 (${comment.replyCount})`}
                      </button>
                    )}
                  </div>

                  {/* 回复输入框 */}
                  {replyTo?.id === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`回复 ${comment.userName}...`}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitReply(comment.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        className="px-3 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:bg-gray-300 transition-colors"
                      >
                        回复
                      </button>
                    </div>
                  )}

                  {/* 回复列表 */}
                  {expandedReplies.includes(comment.id) && repliesMap[comment.id] && (
                    <div className="mt-3 ml-2 pl-3 border-l-2 border-gray-100 space-y-3">
                      {repliesMap[comment.id].map((reply) => (
                        <div key={reply.id} className="flex gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-primary-200 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {reply.userName?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-xs">{reply.userName}</span>
                              <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                              {user && user.id === reply.userId && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-xs text-red-400 hover:text-red-600 ml-auto"
                                >
                                  删除
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 mt-0.5">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                      {(comment.replyCount || 0) > 3 && (
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="text-xs text-pink-500 hover:text-pink-600"
                        >
                          查看全部 {comment.replyCount} 条回复
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
