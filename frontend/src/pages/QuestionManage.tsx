import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
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
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

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

  const handleImport = async () => {
    if (!importJson.trim()) {
      message.error('请输入 JSON 数据');
      return;
    }
    let questions: Partial<Question>[];
    try {
      const parsed = JSON.parse(importJson);
      questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        message.error('JSON 格式错误：需要题目数组');
        return;
      }
    } catch {
      message.error('JSON 解析失败，请检查格式');
      return;
    }

    setImporting(true);
    try {
      const res = await questionApi.importQuestions(questions);
      if (res.data) {
        const data = res.data as { imported: number; skipped: number; failed: number; errors: string[] };
        message.success(`导入完成：成功 ${data.imported} 题，跳过 ${data.skipped} 题，失败 ${data.failed} 题`);
        if (data.errors && data.errors.length > 0) {
          Modal.warning({ title: '部分导入失败', content: data.errors.join('\n') });
        }
      }
      setImportModalVisible(false);
      setImportJson('');
      loadQuestions();
    } catch (error) {
      console.error(error);
      message.error('导入请求失败');
    } finally {
      setImporting(false);
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
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAdd}
          size={isMobile ? 'large' : 'middle'}
        >
          新增题目
        </Button>
        <Button
          icon={<ImportOutlined />}
          onClick={() => setImportModalVisible(true)}
          size={isMobile ? 'large' : 'middle'}
        >
          批量导入
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

      <Modal
        title="批量导入题目"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => { setImportModalVisible(false); setImportJson(''); }}
        width={isMobile ? '90vw' : 800}
        style={{ top: isMobile ? 20 : 100 }}
        okText="导入"
        cancelText="取消"
        confirmLoading={importing}
      >
        <p style={{ marginBottom: 8, color: '#666' }}>
          请粘贴 JSON 格式的题目数组，支持以下格式：
        </p>
        <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, marginBottom: 12, overflow: 'auto', maxHeight: 120 }}>
{`[
  {
    "title": "题目标题",
    "content": "题目描述",
    "type": "choice 或 judge",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "answer": "A",
    "analysis": "解析",
    "difficulty": 1-5,
    "category": "分类",
    "tags": ["标签1", "标签2"]
  }
]`}
        </pre>
        <TextArea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="在此粘贴 JSON 数据..."
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Modal>
    </div>
  );
};

export default QuestionManage;