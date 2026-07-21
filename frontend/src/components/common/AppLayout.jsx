import React from 'react';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';
import NotificationTray from './NotificationTray.jsx';

const AppLayout = ({ title, children }) => (
  <div className="flex h-screen overflow-hidden bg-mist">
    <Sidebar />
    <div className="flex flex-1 flex-col overflow-hidden">
      <Navbar title={title} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </div>
    <NotificationTray />
  </div>
);

export default AppLayout;
