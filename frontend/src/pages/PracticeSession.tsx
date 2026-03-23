import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Button, Radio, Space, Typography, Divider, 
  Tag, Alert, Progress, Row, Col, Statistic, Modal,
  Result, message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { questionApi, answerApi } from '../api';
import type { Question } from '../types';

const { Title, Paragraph, Text } = Typography;

interface PracticeMode {
  mode: 'sequential' | 'random'; // 顺序/随机
  count: number; // 题目数量
  category?: string; // 分类
  difficulty?: number; // 难度
}

const PracticeSession: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 答题设置
  const [practiceMode, setPracticeMode] = useState<PracticeMode>({
    mode: 'random',
    count: 10,
  });

  // 答题状态
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [result, setResult] = useState<{
    is_correct?: boolean;
    correct_answer?: string;
    analysis?: string;
  } | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string>();

  // 加载题目
  useEffect(() => {
    if (questions.length === 0 && !loading) {
      loadQuestions();
    }
  }, []);

  // 计时器
  useEffect(() => {
    if (questions.length > 0 && !showResult) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [questions, showResult, startTime]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(undefined);
    try {
      // 获取所有题目
      const res = await questionApi.getQuestions({
        page: 1,
        pageSize: 1000,
        category: practiceMode.category,
        difficulty: practiceMode.difficulty?.toString(),
      });

      if (res.data && res.data.list.length > 0) {
        let selectedQuestions = [...res.data.list];

        // 随机抽题
        if (practiceMode.mode === 'random') {
          selectedQuestions = selectedQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, practiceMode.count);
        } else {
          // 顺序答题，取前 N 道
          selectedQuestions = selectedQuestions.slice(0, practiceMode.count);
        }

        if (selectedQuestions.length === 0) {
          setError('没有符合条件的题目');
        } else {
          setQuestions(selectedQuestions);
          setStartTime(Date.now());
        }
      } else {
        setError('没有找到题目，请先添加题目');
      }
    } catch (error: any) {
      console.error('加载题目失败:', error);
      setError('加载题目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];
  const options = currentQuestion?.options ? (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options) : [];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) {
      message.warning('请选择答案');
      return;
    }

    setSubmitting(true);
    try {
      const res = await answerApi.submitAnswer({
        question_id: currentQuestion.id,
        user_answer: selectedAnswer,
        response_time: elapsedTime,
      });

      if (res.data) {
        setResult(res.data);
        setAnsweredCount(prev => prev + 1);
        if (res.data.is_correct) {
          setCorrectCount(prev => prev + 1);
          message.success('回答正确！');
        } else {
          message.error('回答错误');
        }
      }
    } catch (error: any) {
      console.error('提交答案失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setResult(null);
      setElapsedTime(0);
      setStartTime(Date.now());
    } else {
      // 最后一题，显示总结
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedAnswer('');
      setResult(null);
      setElapsedTime(0);
      setStartTime(Date.now());
    }
  };

  const handleRestart = () => {
    Modal.confirm({
      title: '确认重新开始',
      content: '确定要重新开始答题吗？当前进度将会丢失。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        setCurrentIndex(0);
        setAnsweredCount(0);
        setCorrectCount(0);
        setSelectedAnswer('');
        setResult(null);
        setShowResult(false);
        loadQuestions();
      },
    });
  };

  const handleExit = () => {
    Modal.confirm({
      title: '确认退出',
      content: `已答 ${answeredCount} 题，正确 ${correctCount} 题。确定要退出吗？`,
      okText: '退出',
      cancelText: '继续',
      onOk: () => {
        navigate('/questions');
      },
    });
  };

  // 显示设置页面
  if (questions.length === 0 && !loading) {
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <div style={{ marginBottom: 24 }}>
            <Title level={isMobile ? 4 : 3}>答题设置</Title>
            <Text type="secondary">配置答题模式和题目数量</Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong>答题模式：</Text>
            <Radio.Group
              value={practiceMode.mode}
              onChange={(e) => setPracticeMode(prev => ({ ...prev, mode: e.target.value }))}
              style={{ marginTop: 8 }}
            >
              <Radio.Button value="random">
                <ThunderboltOutlined /> 随机抽题
              </Radio.Button>
              <Radio.Button value="sequential">
                <BookOutlined /> 顺序答题
              </Radio.Button>
            </Radio.Group>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Text strong>题目数量：</Text>
            <Radio.Group
              value={practiceMode.count}
              onChange={(e) => setPracticeMode(prev => ({ ...prev, count: e.target.value }))}
              style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <Radio value={5}>5 题</Radio>
              <Radio value={10}>10 题</Radio>
              <Radio value={20}>20 题</Radio>
              <Radio value={50}>50 题</Radio>
              <Radio value={100}>100 题</Radio>
            </Radio.Group>
          </div>

          <Space size={16}>
            <Button 
              type="primary" 
              size="large"
              onClick={loadQuestions}
              loading={loading}
              block={isMobile}
            >
              开始答题
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/questions')}
              block={isMobile}
            >
              返回列表
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // 显示错误
  if (error) {
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <Result
            status="error"
            title={error}
            extra={
              <Space direction={isMobile ? 'vertical' : 'horizontal'} size={16}>
                <Button type="primary" onClick={loadQuestions}>重试</Button>
                <Button onClick={() => navigate('/questions')}>返回列表</Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  // 显示答题总结
  if (showResult) {
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    
    return (
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Card size={isMobile ? 'small' : 'default'}>
          <Result
            status="success"
            title="答题完成！"
            subTitle={`共 ${questions.length} 题，答对 ${correctCount} 题，正确率 ${accuracy}%`}
            extra={
              <Space direction={isMobile ? 'vertical' : 'horizontal'} size={16}>
                <Button 
                  type="primary" 
                  size="large"
                  onClick={handleRestart}
                >
                  再来一次
                </Button>
                <Button 
                  size="large"
                  onClick={() => navigate('/questions')}
                >
                  返回列表
                </Button>
              </Space>
            }
          />

          <Divider />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic 
                title="总题数" 
                value={questions.length} 
                prefix={<BookOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="已答题" 
                value={answeredCount} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic 
                title="正确数" 
                value={correctCount} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">总用时：{elapsedTime} 秒</Text>
            <br />
            <Text type="secondary">
              平均每题：{answeredCount > 0 ? Math.round(elapsedTime / answeredCount) : 0} 秒
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // 显示答题界面
  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      {/* 进度条 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text strong>进度：{currentIndex + 1} / {questions.length}</Text>
          <Text type="secondary">
            已答 {answeredCount} 题 | 正确 {correctCount} 题
          </Text>
        </div>
        <Progress 
          percent={progress} 
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
          size={isMobile ? 'small' : 'default'}
        />
      </div>

      <Card 
        size={isMobile ? 'small' : 'default'}
        extra={
          <Tag icon={<ClockCircleOutlined />} color="blue">
            {elapsedTime}秒
          </Tag>
        }
      >
        {/* 题目信息 */}
        <div style={{ marginBottom: 24 }}>
          <Space 
            direction={isMobile ? 'vertical' : 'horizontal'} 
            style={{ marginBottom: 16, width: '100%' }}
            size={isMobile ? 8 : 16}
          >
            <Tag color={currentQuestion?.type === 'choice' ? 'blue' : 'green'}>
              {currentQuestion?.type === 'choice' ? '选择题' : '判断题'}
            </Tag>
            <Text style={{ fontSize: isMobile ? 12 : 14 }}>
              难度：
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  style={{ color: i < (currentQuestion?.difficulty || 0) ? '#f5222d' : 'var(--star-inactive)', fontSize: isMobile ? 14 : 16 }}
                >
                  ★
                </span>
              ))}
            </Text>
            {currentQuestion?.category && (
              <Tag>{currentQuestion.category}</Tag>
            )}
          </Space>

          <Title level={isMobile ? 5 : 4} style={{ fontSize: isMobile ? 16 : 20 }}>
            {currentQuestion?.title}
          </Title>
          
          {currentQuestion?.content && (
            <Paragraph 
              style={{ 
                whiteSpace: 'pre-wrap', 
                background: 'var(--bg-tertiary)', 
                padding: isMobile ? 12 : 16, 
                borderRadius: 4,
                fontSize: isMobile ? 14 : 16,
              }}
            >
              {currentQuestion.content}
            </Paragraph>
          )}
        </div>

        <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />

        {/* 答题区域 */}
        {!result ? (
          <div>
            {currentQuestion?.type === 'choice' ? (
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
            {result.is_correct ? (
              <Alert
                message="回答正确！"
                description={
                  <div>
                    <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                      你的答案：<strong style={{ color: '#52c41a' }}>{selectedAnswer}</strong>
                    </p>
                    {result.analysis && (
                      <>
                        <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />
                        <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', marginBottom: 8 }}>
                          答案解析：
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? 14 : 16, color: 'var(--subtle-text)' }}>
                          {result.analysis}
                        </p>
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
                    <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                      你的答案：<strong style={{ color: '#ff4d4f' }}>{selectedAnswer}</strong>
                    </p>
                    <p style={{ fontSize: isMobile ? 14 : 16, marginBottom: 8 }}>
                      正确答案：<strong style={{ color: '#52c41a' }}>{result.correct_answer}</strong>
                    </p>
                    {result.analysis && (
                      <>
                        <Divider style={{ margin: isMobile ? '16px 0' : '24px 0' }} />
                        <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 'bold', marginBottom: 8 }}>
                          答案解析：
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? 14 : 16, color: 'var(--subtle-text)' }}>
                          {result.analysis}
                        </p>
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

            <Space 
              direction={isMobile ? 'vertical' : 'horizontal'} 
              size={16}
              style={{ width: '100%', justifyContent: isMobile ? 'stretch' : 'space-between' }}
            >
              <Button
                size="large"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                上一题
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
              >
                {currentIndex < questions.length - 1 ? '下一题' : '查看结果'}
              </Button>
            </Space>
          </div>
        )}
      </Card>

      {/* 底部操作栏 */}
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleExit}>
          退出
        </Button>
        <Button onClick={handleRestart}>
          重新开始
        </Button>
      </div>
    </div>
  );
};

export default PracticeSession;
