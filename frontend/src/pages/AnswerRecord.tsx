import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Card, Select, Pagination, Button, Empty, Typography } from 'antd';
import { ReloadOutlined, BookOutlined } from '@ant-design/icons';
import { answerApi } from '../api';
import { message } from 'antd';
import type { AnswerRecord } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const AnswerRecord: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCorrect, setIsCorrect] = useState<string>();

  useEffect(() => {
    loadRecords();
  }, [page, pageSize, isCorrect]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await answerApi.getAnswerRecords({
        page,
        pageSize,
        is_correct: isCorrect === undefined ? undefined : isCorrect === 'true',
      });
      if (res.data) {
        setRecords(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error: any) {
      console.error('加载答题记录失败:', error);
      if (error.message?.includes('401') || error.message?.includes('未认证')) {
        message.error('请先登录');
      } else {
        message.error('加载答题记录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AnswerRecord> = [
    {
      title: '题目',
      dataIndex: 'question',
      key: 'question',
      render: (question?: any) => question?.title || '未知题目',
      ellipsis: true,
    },
    {
      title: '你的答案',
      dataIndex: 'user_answer',
      key: 'user_answer',
      width: 120,
    },
    {
      title: '正确答案',
      dataIndex: 'question',
      key: 'correct_answer',
      width: 120,
      render: (question?: any) => question?.answer || '-',
    },
    {
      title: '结果',
      dataIndex: 'is_correct',
      key: 'is_correct',
      width: 80,
      render: (isCorrect: boolean) => (
        <Tag color={isCorrect ? 'green' : 'red'}>
          {isCorrect ? '正确' : '错误'}
        </Tag>
      ),
    },
    {
      title: '答题时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString(),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }} size={isMobile ? 'small' : 'default'}>
        <Space 
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: '100%' }}
          size={isMobile ? 12 : 16}
        >
          <Select
            placeholder="筛选结果"
            allowClear
            style={{ width: isMobile ? '100%' : 120 }}
            value={isCorrect}
            onChange={setIsCorrect}
            options={[
              { label: '全部', value: undefined },
              { label: '正确', value: 'true' },
              { label: '错误', value: 'false' },
            ]}
            size={isMobile ? 'large' : 'middle'}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadRecords}
            block={isMobile}
            size={isMobile ? 'large' : 'middle'}
          >
            刷新
          </Button>
        </Space>
      </Card>

      <Card size={isMobile ? 'small' : 'default'}>
        {records.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">暂无答题记录</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<BookOutlined />}
                    onClick={() => navigate('/questions')}
                    size={isMobile ? 'large' : 'middle'}
                  >
                    去答题
                  </Button>
                </div>
              </div>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: isMobile ? 800 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        )}
        <div style={{ 
          marginTop: 16, 
          display: 'flex', 
          justifyContent: isMobile ? 'center' : 'flex-end',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={!isMobile}
            showTotal={(total) => `共 ${total} 条`}
            onChange={(page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            }}
            showQuickJumper={!isMobile}
            size={isMobile ? 'small' : 'default'}
          />
        </div>
      </Card>
    </div>
  );
};

export default AnswerRecord;