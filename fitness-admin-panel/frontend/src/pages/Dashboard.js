import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, chartsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/recent-activity'),
          api.get('/dashboard/charts')
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
        setCharts(chartsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  if (loading) {
    return <div className="empty-state">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">👥</div>
          <div className="stat-label">Active Members</div>
          <div className="stat-value">{stats.activeMembers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🏋️</div>
          <div className="stat-label">Workout Programs</div>
          <div className="stat-value">{stats.totalPrograms}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">${stats.totalRevenue?.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📅</div>
          <div className="stat-label">Upcoming Classes</div>
          <div className="stat-value">{stats.upcomingClasses}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue by Month</h3>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Members by Plan</h3>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.membersByPlan || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(charts.membersByPlan || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Members</h3>
          </div>
          {activity.recentUsers?.map(user => (
            <div key={user.id} className="list-item">
              <div className="avatar">{user.first_name[0]}{user.last_name[0]}</div>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontWeight: 500 }}>{user.first_name} {user.last_name}</div>
                <div className="text-muted">{user.email}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
          </div>
          {activity.recentOrders?.map(order => (
            <div key={order.id} className="list-item">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Order #{order.id}</div>
                <div className="text-muted">{order.first_name} {order.last_name}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>${order.total_amount}</div>
                <span className={`badge badge-${order.status === 'delivered' ? 'success' : 'info'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Classes</h3>
          </div>
          {activity.upcomingClasses?.map(cls => (
            <div key={cls.id} className="list-item">
              <div>
                <div style={{ fontWeight: 500 }}>{cls.class_name}</div>
                <div className="text-muted">
                  {format(new Date(cls.start_time), 'MMM d, h:mm a')} - {cls.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
