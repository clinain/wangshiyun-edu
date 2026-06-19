import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const EditLesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // 直接重定向到 Create 页面的编辑模式，使用完整的学段匹配逻辑
  if (id) {
    return <Navigate to={`/lessons/create?edit=${id}`} replace />;
  }

  return <Navigate to="/lessons/create" replace />;
};

export default EditLesson;
