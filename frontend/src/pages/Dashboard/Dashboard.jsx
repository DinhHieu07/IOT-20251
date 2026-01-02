
const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Tổng thiết bị</h3>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <h3>Thiết bị hoạt động</h3>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <h3>Dữ liệu hôm nay</h3>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <h3>Trạng thái hệ thống</h3>
          <p className="stat-value">Bình thường</p>
        </div>
      </div>
      <div className="dashboard-content">
        <p>Nội dung dashboard sẽ được cập nhật sau...</p>
      </div>
    </div>
  );
};

export default Dashboard;

