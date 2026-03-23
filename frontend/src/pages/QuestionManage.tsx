import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { questionApi } from '../api';
import type { Question } from '../types';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;

const QuestionManage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await questionApi.getQuestions({ page: 1, pageSize: 1000 });
      if (res.data) {
        setQuestions(res.data.list);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingQuestion(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    form.setFieldsValue({
      ...question,
      options: question.options ? JSON.parse(question.options) : [],
      tags: question.tags ? question.tags.split(',') : [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await questionApi.deleteQuestion(id);
      message.success('删除成功');
      loadQuestions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        options: values.options || [],
        tags: values.tags || [],
      };

      if (editingQuestion) {
        await questionApi.updateQuestion(editingQuestion.id, data);
        message.success('更新成功');
      } else {
        await questionApi.createQuestion(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadQuestions();
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
                color: i < difficulty ? '#f5222d' : 'var(--star-inactive)',
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
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个题目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          block={isMobile}
          size={isMobile ? 'large' : 'middle'}
        >
          {isMobile ? '新增题目' : null}
        </Button>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table
          columns={columns}
          dataSource={questions}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: isMobile ? 700 : undefined }}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      <Modal
        title={editingQuestion ? '编辑题目' : '新增题目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '90vw' : 800}
        style={{ top: isMobile ? 20 : 100 }}
        bodyStyle={{ maxHeight: isMobile ? '70vh' : 'none', overflowY: 'auto' }}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'choice',
            difficulty: 1,
          }}
          size={isMobile ? 'large' : 'middle'}
        >
          <Form.Item
            name="title"
            label="题目"
            rules={[{ required: true, message: '请输入题目' }]}
          >
            <Input placeholder="请输入题目内容" style={{ minHeight: isMobile ? 44 : 32 }} />
          </Form.Item>

          <Form.Item name="content" label="题目描述">
            <TextArea
              placeholder="请输入题目详细描述（可选）"
              rows={isMobile ? 4 : 3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="题型"
            rules={[{ required: true, message: '请选择题型' }]}
          >
            <Select style={{ minHeight: isMobile ? 44 : 32 }}>
              <Option value="choice">选择题</Option>
              <Option value="judge">判断题</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'choice' ? (
                <Form.Item
                  name="options"
                  label="选项"
                  rules={[{ required: true, message: '请输入选项' }]}
                >
                  <Select
                    mode="tags"
                    placeholder="请输入选项内容，每行一个选项"
                    style={{ width: '100%', minHeight: isMobile ? 44 : 32 }}
                    tokenSeparators={[',']}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="answer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
          >
            <Input 
              placeholder="选择题请输入 A/B/C/D，判断题请输入 true/false" 
              style={{ minHeight: isMobile ? 44 : 32 }}
            />
          </Form.Item>

          <Form.Item name="analysis" label="答案解析">
            <TextArea
              placeholder="请输入答案解析（可选）"
              rows={isMobile ? 4 : 3}
            />
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度"
            rules={[{ required: true, message: '请选择难度' }]}
          >
            <InputNumber 
              min={1} 
              max={5} 
              style={{ width: '100%' }}
              size={isMobile ? 'large' : 'default'}
            />
          </Form.Item>

          <Form.Item name="category" label="分类">
            <Input placeholder="请输入分类（可选）" style={{ minHeight: isMobile ? 44 : 32 }} />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="请输入标签"
              style={{ width: '100%', minHeight: isMobile ? 44 : 32 }}
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionManage;