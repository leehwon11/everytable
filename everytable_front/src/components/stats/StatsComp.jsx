import { Routes, Route } from "react-router-dom";
import StatsDashboard from "./StatsDashboard";
import StatsSalesPeriod from "./StatsSalesPeriod";

function StatsComp() {
  return (
    <Routes>
      <Route path="dashboard" element={<StatsDashboard />} />
      <Route path="sales" element={<StatsSalesPeriod />} />
    </Routes>
  );
}

export default StatsComp;
