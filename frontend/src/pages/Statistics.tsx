import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Space, Empty, Typography } from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  BookOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { practiceApi } from '../api';
import type { Statistics } from '../types';

const { Title, Text } = Typography;

const StatisticsPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const res = await practiceApi.getStatistics();
      if (res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <Card loading={loading} />;
  }

  const accuracy = stats.stats.total_answered > 0
    ? Math.round((stats.stats.correct_count / stats.stats.total_answered) * 100)
    : 0;

  return (
    <div>
      {/* 概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总答题数"
              value={stats.stats.total_answered}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="正确率"
              value={accuracy}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: accuracy >= 60 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="连续天数"
              value={stats.stats.streak_days}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="收藏题目"
              value={stats.favorite_count}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细统计 */}
      <Row gutter={[16, 16]}>
        {/* 答题情况 */}
        <Col xs={24} lg={12}>
          <Card title="答题情况" size={isMobile ? 'small' : 'default'}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>正确题目</Text>
                  <Text strong>{stats.stats.correct_count} 道</Text>
                </div>
                <Progress
                  percent={accuracy}
                  strokeColor="#52c41a"
                  format={() => `${stats.stats.correct_count} / ${stats.stats.total_answered}`}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>错误题目</Text>
                  <Text strong>{stats.stats.wrong_count} 道</Text>
                </div>
                <Progress
                  percent={stats.stats.total_answered > 0 ? Math.round((stats.stats.wrong_count / stats.stats.total_answered) * 100) : 0}
                  strokeColor="#ff4d4f"
                  format={() => `${stats.stats.wrong_count} / ${stats.stats.total_answered}`}
                />
              </div>
              {stats.stats.total_time_spent > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text>总用时</Text>
                    <Text strong>
                      <ClockCircleOutlined /> {Math.floor(stats.stats.total_time_spent / 60)} 分钟
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>平均答题时间</Text>
                    <Text strong>{stats.stats.avg_response_time} 秒/题</Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 分类统计 */}
        <Col xs={24} lg={12}>
          <Card title="分类统计" size={isMobile ? 'small' : 'default'}>
            {stats.category_stats && stats.category_stats.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {stats.category_stats.map((cat, index) => {
                  const catAccuracy = cat.count > 0 ? Math.round((cat.correct / cat.count) * 100) : 0;
                  return (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>{cat.category || '未分类'}</Text>
                        <Text>
                          {cat.correct}/{cat.count} ({catAccuracy}%)
                        </Text>
                      </div>
                      <Progress
                        percent={catAccuracy}
                        strokeColor={catAccuracy >= 60 ? '#52c41a' : '#ff4d4f'}
                        size="small"
                      />
                    </div>
                  );
                })}
              </Space>
            ) : (
              <Empty description="暂无分类数据" />
            )}
          </Card>
        </Col>

        {/* 成就统计 */}
        <Col xs={24}>
          <Card title="学习成就" size={isMobile ? 'small' : 'default'}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <TrophyOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>{stats.achievement_count}</Title>
                <Text type="secondary">已解锁成就</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsPage;
