import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders', { params: { status: statusFilter } });
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (id) => {
    try {
      const res = await api.get(`/orders/${id}`);
      setSelectedOrder(res.data);
      setShowModal(true);
    } catch (error) {
      alert('Error fetching order details');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-purple',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
      </div>

      <div className="card">
        <div className="toolbar">
          <select
            className="form-input"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 500 }}>#{order.id}</td>
                  <td>
                    <div>{order.first_name} {order.last_name}</div>
                    <div className="text-muted">{order.email}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>${order.total_amount}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <span className={`badge ${order.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td>{format(new Date(order.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => viewOrder(order.id)}>View</button>
                      <select
                        className="form-input btn-sm"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={{ padding: '6px 8px', fontSize: 12 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Order #{selectedOrder.id}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <div className="mb-4">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Customer Information</h4>
              <div>{selectedOrder.first_name} {selectedOrder.last_name}</div>
              <div className="text-muted">{selectedOrder.email}</div>
              <div className="text-muted">{selectedOrder.phone}</div>
            </div>

            <div className="mb-4">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Shipping Address</h4>
              <div className="text-muted">{selectedOrder.shipping_address}</div>
            </div>

            <div className="mb-4">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Order Items</h4>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ marginRight: 8 }}>Status: {getStatusBadge(selectedOrder.status)}</span>
                <span>Payment: <span className={`badge ${selectedOrder.payment_status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{selectedOrder.payment_status}</span></span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Total: ${selectedOrder.total_amount}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
