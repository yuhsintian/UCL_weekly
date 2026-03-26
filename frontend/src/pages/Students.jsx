import React, { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../services/api';
import { Table, Button, Form, Input, Modal, message, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingStudentId, setEditingStudentId] = useState(null);
  const navigate = useNavigate();  // 添加 useNavigate hook

  // 獲取所有學生資料
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      message.error(`獲取學生資料失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 處理表單提交
  const handleSubmit = async (values) => {
    try {
      if (editingStudentId) {
        await updateStudent(editingStudentId, values);
        message.success('學生資料更新成功');
      } else {
        await createStudent(values);
        message.success('學生資料創建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingStudentId(null);
      fetchStudents();
    } catch (error) {
      message.error(`操作失敗: ${error.message}`);
    }
  };

  // 處理編輯學生資料
  const handleEdit = (student) => {
    setEditingStudentId(student.student_id);
    form.setFieldsValue({
      student_id: student.student_id,
      grade: student.grade,
      name: student.name,
      email: student.email,
    });
    setIsModalVisible(true);
  };

  // 處理刪除學生資料
  const handleDelete = async (studentId) => {
    try {
      await deleteStudent(studentId);
      message.success('學生資料刪除成功');
      fetchStudents();
    } catch (error) {
      message.error(`刪除失敗: ${error.message}`);
    }
  };

  // 表格列定義
  const columns = [
    {
      title: '學號',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: '年級',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '信箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            編輯
          </Button>
          <Popconfirm
            title="確定要刪除此學生資料嗎？"
            onConfirm={() => handleDelete(record.student_id)}
            okText="確定"
            cancelText="取消"
          >
            <Button type="link" danger>
              刪除
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Button
            onClick={() => navigate('/')}
          >
            返回週報列表
          </Button>
        </div>
        <div>
          {/* 新增學生按鈕 */}
          <Button
            type="primary"
            onClick={() => {
              setEditingStudentId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            新增學生
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        rowKey="student_id"
        loading={loading}
      />

      <Modal
        title={editingStudentId ? "編輯學生資料" : "新增學生資料"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="student_id"
            label="學號"
            rules={[{ required: true, message: '請輸入學號' }]}
            disabled={!!editingStudentId}
          >
            <Input disabled={!!editingStudentId} />
          </Form.Item>
          <Form.Item
            name="grade"
            label="年級"
            rules={[{ required: true, message: '請輸入年級' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '請輸入姓名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="信箱"
            rules={[
              { required: true, message: '請輸入信箱' },
              { type: 'email', message: '請輸入有效的信箱格式' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingStudentId ? "更新" : "創建"}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Students;
