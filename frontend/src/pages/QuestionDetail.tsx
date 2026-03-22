import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Radio, Space, message, Alert, Typography, Divider, Tag, Empty, Result } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { questionApi, answerApi, practiceApi } from '../api';
import type { Question } from '../types';

const { Title, Paragraph, Text } = Typography;

const QuestionDetail: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<{
    is_correct?: boolean;
    correct_answer?: string;
    analysis?: string;
    streak_days?: number;
  } | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadQuestion();
    setStartTime(Date.now());
    
    // 计时器
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    // 检查是否已收藏
    checkFavorite();
  }, [id]);

  const loadQuestion = async () => {
    if (!id) {
      setError('题目 ID 不存在');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const res = await questionApi.getQuestion(parseInt(id));
      if (res.data) {
        setQuestion(res.data);
        // 验证题目数据完整性
        if (!res.data.type || !res.data.answer) {
          setError('题目数据不完整');
        }
        // 验证选项（选择题）
        if (res.data.type === 'choice' && res.data.options) {
          try {
            const opts = JSON.parse(res.data.options);
            if (!Array.isArray(opts) || opts.length === 0) {
              setError('题目选项格式错误');
            }
          } catch (e) {
            setError('题目选项解析失败');
          }
        }
      } else {
        setError('题目不存在或已被删除');
      }
    } catch (error: any) {
      console.error('加载题目失败:', error);
      if (error.response?.status === 404) {
        setError('题目不存在 (404)');
      } else if (error.response?.status === 401) {
        setError('请先登录');
      } else if (error.code === 'ERR_NETWORK') {
        setError('网络连接失败，请检查后端服务');
      } else {
        setError('加载题目失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || !id) {
      message.warning('请先选择答案');
      return;
    }

    if (!question) {
      message.error('题目数据不存在');
      return;
    }

    setSubmitting(true);
    try {
      const res = await answerApi.submitAnswer({
        question_id: parseInt(id),
        user_answer: selectedAnswer,
        response_time: elapsedTime,
      });
      if (res.data) {
        setResult(res.data);
        setHasAnswered(true);
        if (res.data.is_correct) {
          message.success('回答正确！🎉');
          if (res.data.streak_days && res.data.streak_days > 1) {
            message.success(`连续答题 ${res.data.streak_days} 天，继续加油！`);
          }
        } else {
          message.error('回答错误，请查看答案解析');
        }
      }
    } catch (error: any) {
      console.error('提交答案失败:', error);
      if (error.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else {
        message.error('提交失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const checkFavorite = async () => {
    if (!id) return;
    try {
      const res = await practiceApi.getFavorites({ page: 1, pageSize: 100 });
      if (res.data) {
        const isFav = res.data.list.some(fav => fav.question_id === parseInt(id));
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    setSelectedAnswer('');
    setResult(null);
    setHasAnswered(false);
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    try {
      if (isFavorite) {
        await practiceApi.removeFavorite(parseInt(id));
        message.success('取消收藏成功');
        setIsFavorite(false);
      } else {
        await practiceApi.addFavorite(parseInt(id));
        message.success('收藏成功');
        setIsFavorite(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 显示加载状态
  if (loading) {
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 16, color: '#666' }}>正在加载题目...</div>
            <div style={{ fontSize: 12, color: '#999' }}>请等待</div>
          </div>
        </Card>
      </div>
    );
  }

  // 显示错误状态
  if (error || !question) {
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <Result
            status="error"
            title={error || '题目不存在'}
            subTitle={error ? error : '题目不存在或已被删除'}
            extra={
              <Space direction={isMobile ? 'vertical' : 'horizontal'} size={16}>
                <Button 
                  type="primary" 
                  onClick={loadQuestion}
                  size={isMobile ? 'large' : 'middle'}
                >
                  重试
                </Button>
                <Button 
                  onClick={() => navigate('/questions')}
                  size={isMobile ? 'large' : 'middle'}
                >
                  返回列表
                </Button>
                {!error?.includes('登录') && (
                  <Button 
                    onClick={() => window.location.reload()}
                    size={isMobile ? 'large' : 'middle'}
                  >
                    刷新页面
                  </Button>
                )}
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  const options = question.options ? JSON.parse(question.options) : [];
  
  // 验证选项数据
  if (question.type === 'choice' && (!Array.isArray(options) || options.length === 0)) {
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <Result
            status="warning"
            title="题目数据不完整"
            subTitle="该题目的选项数据有问题，无法进行答题。请联系管理员修复。"
            extra={
              <Button 
                type="primary" 
                onClick={() => navigate('/questions')}
                size={isMobile ? 'large' : 'middle'}
              >
                返回列表
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/questions')}
        style={{ marginBottom: 16 }}
        size={isMobile ? 'large' : 'middle'}
        block={isMobile}
      >
        返回列表
      </Button>

      <Card 
        size={isMobile ? 'small' : 'default'}
        extra={
          <Button
            type={isFavorite ? 'primary' : 'default'}
            icon={isFavorite ? <StarFilled /> : <StarOutlined />}
            onClick={handleToggleFavorite}
            size={isMobile ? 'small' : 'middle'}
          >
            {isFavorite ? '已收藏' : '收藏'}
          </Button>
        }
      >
        <div style={{ marginBottom: 24 }}>
          <Space 
            direction={isMobile ? 'vertical' : 'horizontal'} 
            style={{ marginBottom: 16, width: '100%' }}
            size={isMobile ? 8 : 16}
          >
            <Tag color={question.type === 'choice' ? 'blue' : 'green'}>
              {question.type === 'choice' ? '选择题' : '判断题'}
            </Tag>
            <Text style={{ fontSize: isMobile ? 12 : 14 }}>
              难度：
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  style={{ color: i < question.difficulty ? '#f5222d' : '#d9d9d9', fontSize: isMobile ? 14 : 16 }}
                >
                  ★
                </span>
              ))}
            </Text>
            {question.category && (
              <Tag>{question.category}</Tag>
            )}
            {!hasAnswered && (
              <Tag icon={<ClockCircleOutlined />} color="blue">
                {elapsedTime}秒
              </Tag>
            )}
          </Space>

          <Title level={isMobile ? 5 : 4} style={{ fontSize: isMobile ? 16 : 20 }}>
            {question.title}
          </Title>
          
          {question.content && (
            <Paragraph 
              style={{ 
                whiteSpace: 'pre-wrap', 
                background: '#f5f5f5', 
                padding: isMobile ? 12 : 16, 
                borderRadius: 4,
                fontSize: isMobile ? 14 : 16,
              }}
            >
              {question.content}
            </Paragraph>
          )}
        </div>

        <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />

        {!hasAnswered ? (
          <div>
            {question.type === 'choice' ? (
              <Radio.Group
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16, width: '100%' }}
              >
                {options.map((option: string, index: number) => {
                  const label = String.fromCharCode(65 + index);
                  return (
                    <Radio.Button
                      key={label}
                      value={label}
                      style={{ 
                        padding: isMobile ? '16px 12px' : '12px 16px', 
                        height: 'auto',
                        width: '100%',
                        marginBottom: isMobile ? 8 : 0,
                        fontSize: isMobile ? 15 : 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <strong>{label}.</strong>
                        <span style={{ flex: 1 }}>{option}</span>
                      </div>
                    </Radio.Button>
                  );
                })}
              </Radio.Group>
            ) : (
              <Radio.Group
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                style={{ 
                  display: 'flex', 
                  gap: isMobile ? 12 : 16,
                  width: '100%',
                  flexDirection: isMobile ? 'column' : 'row',
                }}
              >
                <Radio.Button 
                  value="true" 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    padding: isMobile ? '16px' : '12px 24px',
                    height: 'auto',
                    minHeight: 44,
                  }}
                >
                  正确
                </Radio.Button>
                <Radio.Button 
                  value="false" 
                  style={{ 
                    flex: 1, 
                    textAlign: 'center',
                    padding: isMobile ? '16px' : '12px 24px',
                    height: 'auto',
                    minHeight: 44,
                  }}
                >
                  错误
                </Radio.Button>
              </Radio.Group>
            )}

            <div style={{ marginTop: isMobile ? 24 : 32 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!selectedAnswer}
                block={isMobile}
                style={{ minHeight: 48 }}
              >
                提交答案
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {result && (
              <>
                {result.is_correct ? (
                  <Alert
                    message="回答正确！"
                    description={
                      <div>
                        <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>你的答案：<strong style={{ color: '#52c41a' }}>{selectedAnswer}</strong></p>
                        {result.analysis && (
                          <>
                            <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />
                            <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', marginBottom: 8 }}>答案解析：</p>
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? 14 : 16, color: '#666' }}>{result.analysis}</p>
                          </>
                        )}
                      </div>
                    }
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    style={{ marginBottom: 24 }}
                    closable
                  />
                ) : (
                  <Alert
                    message="回答错误"
                    description={
                      <div>
                        <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>你的答案：<strong style={{ color: '#ff4d4f' }}>{selectedAnswer}</strong></p>
                        <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>正确答案：<strong style={{ color: '#52c41a' }}>{result.correct_answer}</strong></p>
                        {result.analysis && (
                          <>
                            <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />
                            <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', marginBottom: 8 }}>答案解析：</p>
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? 14 : 16, color: '#666' }}>{result.analysis}</p>
                          </>
                        )}
                      </div>
                    }
                    type="error"
                    showIcon
                    icon={<CloseCircleOutlined />}
                    style={{ marginBottom: 24 }}
                    closable
                  />
                )}
              </>
            )}

            <Space 
              direction={isMobile ? 'vertical' : 'horizontal'} 
              size={16}
              style={{ width: '100%', justifyContent: isMobile ? 'stretch' : 'center' }}
            >
              <Button
                type="default"
                size="large"
                onClick={handleReset}
                block={isMobile}
                style={{ minHeight: 44 }}
              >
                再答一次
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/questions')}
                block={isMobile}
                style={{ minHeight: 44 }}
              >
                返回列表
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuestionDetail;
