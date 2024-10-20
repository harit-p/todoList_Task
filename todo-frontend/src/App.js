import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import TaskList from '../src/components/TaskList';

import './App.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" exact component={TaskList} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
