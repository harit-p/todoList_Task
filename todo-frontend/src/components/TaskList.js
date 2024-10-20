import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../components/TaskList.css';

const socket = io('http://localhost:5000');

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [priority, setPriority] = useState('low');
    const [dueDate, setDueDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            const response = await axios.get('http://localhost:5000/tasks', {
                headers: { Authorization: localStorage.getItem('token') }
            });
            setTasks(response.data);
        };
        fetchTasks();

        socket.on('taskAdded', (task) => {
            setTasks((prevTasks) => [...prevTasks, task]);
        });

        socket.on('taskUpdated', (updatedTask) => {
            setTasks((prevTasks) =>
                prevTasks.map((task) => (task._id === updatedTask._id ? updatedTask : task))
            );
        });

        socket.on('taskDeleted', (id) => {
            setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
        });

        return () => {
            socket.off('taskAdded');
            socket.off('taskUpdated');
            socket.off('taskDeleted');
        };
    }, []);

    const addTask = async () => {
        const task = { text: newTask, priority, dueDate };
        await axios.post('http://localhost:5000/tasks', task, {
            headers: { Authorization: localStorage.getItem('token') }
        });
        setNewTask('');
        setPriority('low');
        setDueDate('');
    };

    const deleteTask = async (id) => {
        await axios.delete(`http://localhost:5000/tasks/${id}`, {
            headers: { Authorization: localStorage.getItem('token') }
        });
    };

    const toggleTaskCompletion = async (task) => {
        const updatedTask = { ...task, completed: !task.completed };
        await axios.put(`http://localhost:5000/tasks/${task._id}`, updatedTask, {
            headers: { Authorization: localStorage.getItem('token') }
        });
    };

    const filteredTasks = tasks.filter(task =>
        task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="task-list">
            <h2>Task List</h2>
            <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
            />
            <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Task"
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
            />
            <button onClick={addTask}>Add Task</button>
            <ul>
                {filteredTasks.map(task => (
                    <li key={task._id} style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                        <span onClick={() => toggleTaskCompletion(task)} style={{ cursor: 'pointer' }}>
                            {task.text} - {task.priority} {task.dueDate && `- Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                        </span>
                        <button onClick={() => deleteTask(task._id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TaskList;
