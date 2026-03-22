import { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Select, Pagination, Card, Row, Col, Statistic, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { questionApi } from '../api';
import type { Question } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Text } = Typography;

const QuestionList: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [category, setCategory] = useState<string>();
  const [difficulty, setDifficulty] = useState<string>();
  const [type, setType] = useState<string>();
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, correct: 0, rate: 0 });

  useEffect(() => {
    loadQuestions();
    loadCategories();
    loadStats();
  }, [page, pageSize, category, difficulty, type]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await questionApi.getQuestions({
        page,
        pageSize,
        category,
        difficulty,
        type,
      });
      if (res.data) {
        setQuestions(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await questionApi.getCategories();
      if (res.data) {
        setCategories(res.data.filter(Boolean));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await questionApi.getQuestions({ page: 1, pageSize: 1000 });
      if (res.data) {
        setStats(prev => ({ ...prev, total: res.data!.total }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const columns: ColumnsType<Question> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'choice' ? 'blue' : 'green'}>
          {type === 'choice' ? '选择题' : '判断题'}
        </Tag>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (difficulty: number) => (
        <Space>
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              style={{
                color: i < difficulty ? '#f5222d' : '#d9d9d9',
                fontSize: 16,
              }}
            >
              ★
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category?: string) => category || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags?: string) => {
        if (!tags) return '-';
        const tagList = tags.split(',').slice(0, 3);
        return (
          <Space wrap>
            {tagList.map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/questions/${record.id}`)}
        >
          答题
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 统计卡片 - 移动端优化 */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic title="总题目数" value={stats.total} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic title="已答题数" value={0} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small">
            <Statistic title="正确率" value={0} suffix="%" valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 - 移动端优化 */}
      <Card style={{ marginBottom: 16 }} size={isMobile ? 'small' : 'default'}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索题目"
              allowClear
              onSearch={(value) => console.log(value)}
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              value={category}
              onChange={setCategory}
              options={categories.map((c) => ({ label: c, value: c }))}
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="难度"
              allowClear
              style={{ width: '100%' }}
              value={difficulty}
              onChange={setDifficulty}
              options={[1, 2, 3, 4, 5].map((d) => ({ label: `难度${d}`, value: d.toString() }))}
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="题型"
              allowClear
              style={{ width: '100%' }}
              value={type}
              onChange={setType}
              options={[
                { label: '选择题', value: 'choice' },
                { label: '判断题', value: 'judge' },
              ]}
              size={isMobile ? 'large' : 'middle'}
            />
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/manage')}
              block={isMobile}
              size={isMobile ? 'large' : 'middle'}
            >
              {isMobile ? '新增题目' : null}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 表格 - 移动端优化 */}
      <Card size={isMobile ? 'small' : 'default'}>
        {questions.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">暂无题目</Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/manage')}
                    size={isMobile ? 'large' : 'middle'}
                  >
                    添加题目
                  </Button>
                </div>
              </div>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table
              columns={columns}
              dataSource={questions}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: isMobile ? 600 : undefined }}
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

export default QuestionList;
