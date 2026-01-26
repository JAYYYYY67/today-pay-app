import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import EmployeeManage from './pages/EmployeeManage';
import SettingsPage from './pages/SettingsPage';
import RetiredEmployeesPage from './pages/RetiredEmployeesPage';

import { DateFilterProvider } from './contexts/DateFilterContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { BusinessProvider } from './contexts/BusinessContext';
import ScrollToTop from './components/common/ScrollToTop';

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <BusinessProvider>
        <DateFilterProvider>
          <FontSizeProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="employees" element={<EmployeeManage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/retired" element={<RetiredEmployeesPage />} />
              </Route>
            </Routes>
          </FontSizeProvider>
        </DateFilterProvider>
      </BusinessProvider>
    </HashRouter>
  );
}

export default App;
