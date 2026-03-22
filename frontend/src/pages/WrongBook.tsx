import { useState, useEffect } from 'react';
import { Table, Tag, Space, Card, Button, message, Pagination, Empty, Select, Modal, Typography } from 'antd';
import { BookOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { practiceApi } from '../api';
import type { WrongBook } from '../types';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const WrongBook: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [records, setRecords] = useState<WrongBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mastered, setMastered] = useState<string>();
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<WrongBook | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecords();
  }, [page, pageSize, mastered]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await practiceApi.getWrongBook({
        page,
        pageSize,
        mastered: mastered === undefined ? undefined : mastered === 'true',
      });
      if (res.data) {
        setRecords(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (questionId: number) => {
    try {
      await practiceApi.markReviewed(questionId);
      message.success('已标记为已掌握');
      loadRecords();
      setReviewModalVisible(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewQuestion = (questionId: number) => {
    navigate(`/questions/${questionId}`);
  };

  const showReviewModal = (record: WrongBook) => {
    setCurrentQuestion(record);
    setReviewModalVisible(true);
  };

  const columns: ColumnsType<WrongBook> = [
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
      title: '错误次数',
      dataIndex: 'wrong_count',
      key: 'wrong_count',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 3 ? 'red' : count > 1 ? 'orange' : 'blue'}>
          {count} 次
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'mastered',
      key: 'mastered',
      width: 100,
      render: (mastered: boolean) => (
        <Tag color={mastered ? 'green' : 'red'}>
          {mastered ? '已掌握' : '未掌握'}
        </Tag>
      ),
    },
    {
      title: '最后错误时间',
      dataIndex: 'last_wrong_at',
      key: 'last_wrong_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? 80 : 200,
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
          {!record.mastered && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => showReviewModal(record)}
              size="small"
            >
              {isMobile ? '' : '已掌握'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <BookOutlined style={{ color: '#1890ff' }} />
            <span>错题本</span>
          </Space>
        }
        size={isMobile ? 'small' : 'default'}
        extra={
          <Select
            placeholder="筛选状态"
            style={{ width: isMobile ? '100%' : 120 }}
            value={mastered}
            onChange={setMastered}
            allowClear
          >
            <Select.Option value="true">已掌握</Select.Option>
            <Select.Option value="false">未掌握</Select.Option>
          </Select>
        }
      >
        {records.length > 0 ? (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {records.map((record) => (
                  <Card
                    key={record.id}
                    size="small"
                    onClick={() => handleViewQuestion(record.question_id)}
                    style={{ cursor: 'pointer' }}
                    actions={[
                      <Button
                        key="review"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          showReviewModal(record);
                        }}
                        disabled={record.mastered}
                      >
                        已掌握
                      </Button>,
                    ]}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Tag color={record.question?.type === 'choice' ? 'blue' : 'green'}>
                        {record.question?.type === 'choice' ? '选择题' : '判断题'}
                      </Tag>
                      <Tag color={record.wrong_count > 3 ? 'red' : record.wrong_count > 1 ? 'orange' : 'blue'}>
                        错误 {record.wrong_count} 次
                      </Tag>
                      <Tag color={record.mastered ? 'green' : 'red'}>
                        {record.mastered ? '已掌握' : '未掌握'}
                      </Tag>
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: 8 }}>
                      {record.question?.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      最后错误：{new Date(record.last_wrong_at).toLocaleString()}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={records}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 1000 }}
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
          <Empty description="暂无错题" />
        )}
      </Card>

      <Modal
        title="确认已掌握"
        open={reviewModalVisible}
        onOk={() => currentQuestion && handleMarkReviewed(currentQuestion.question_id)}
        onCancel={() => setReviewModalVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <p>确认已经掌握了这道题目吗？</p>
        <Text type="secondary" style={{ fontSize: 12 }}>
          标记后该题目将从未掌握列表中移除
        </Text>
      </Modal>
    </div>
  );
};

export default WrongBook;
