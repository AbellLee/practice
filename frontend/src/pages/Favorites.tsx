import { useState, useEffect } from 'react';
import { Table, Tag, Space, Card, Button, message, Pagination, Empty } from 'antd';
import { StarFilled, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { practiceApi } from '../api';
import type { Favorite } from '../types';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

const Favorites: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, [page, pageSize]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await practiceApi.getFavorites({ page, pageSize });
      if (res.data) {
        setFavorites(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (questionId: number) => {
    try {
      await practiceApi.removeFavorite(questionId);
      message.success('取消收藏成功');
      loadFavorites();
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewQuestion = (questionId: number) => {
    navigate(`/questions/${questionId}`);
  };

  const columns: ColumnsType<Favorite> = [
    {
      title: '题目',
      dataIndex: 'question',
      key: 'question',
      render: (question?: any) => question?.title || '未知题目',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'question',
      key: 'type',
      width: 100,
      render: (question?: any) => (
        <Tag color={question?.type === 'choice' ? 'blue' : 'green'}>
          {question?.type === 'choice' ? '选择题' : '判断题'}
        </Tag>
      ),
    },
    {
      title: '难度',
      dataIndex: 'question',
      key: 'difficulty',
      width: 100,
      render: (question?: any) => (
        <span>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{ color: i < (question?.difficulty || 0) ? '#f5222d' : '#d9d9d9' }}
            >
              ★
            </span>
          ))}
        </span>
      ),
    },
    {
      title: '收藏时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? 80 : 150,
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewQuestion(record.question_id)}
            size="small"
          >
            {isMobile ? '' : '查看'}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveFavorite(record.question_id)}
            size="small"
          >
            {isMobile ? '' : '取消收藏'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <StarFilled style={{ color: '#faad14' }} />
            <span>我的收藏</span>
          </Space>
        }
        size={isMobile ? 'small' : 'default'}
      >
        {favorites.length > 0 ? (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {favorites.map((favorite) => (
                  <Card
                    key={favorite.id}
                    size="small"
                    onClick={() => handleViewQuestion(favorite.question_id)}
                    style={{ cursor: 'pointer' }}
                    actions={[
                      <Button
                        key="remove"
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(favorite.question_id);
                        }}
                      >
                        取消收藏
                      </Button>,
                    ]}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={favorite.question?.type === 'choice' ? 'blue' : 'green'}>
                        {favorite.question?.type === 'choice' ? '选择题' : '判断题'}
                      </Tag>
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                        难度：{favorite.question?.difficulty || 1}
                      </span>
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      {favorite.question?.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      收藏于：{new Date(favorite.created_at).toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={favorites}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 800 }}
              />
            )}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={(p, s) => {
                  setPage(p);
                  setPageSize(s);
                }}
                showSizeChanger
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无收藏" />
        )}
      </Card>
    </div>
  );
};

export default Favorites;
