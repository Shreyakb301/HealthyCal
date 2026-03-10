import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MealProvider } from './context/MealContext';
import Home from './components/Home';
import About from './components/About';
import Auth from './components/Auth';
import MealLogPage from './components/MealLogPage';
import NutritionPage from './components/NutritionPage';
import WellnessTipsPage from './components/WellnessTipsPage';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import TrendsPage from './components/TrendsPage';
import './App.css';

const App = () => {
    return (
        <AuthProvider>
            <MealProvider>
                <Router>
                    <div className="app">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/meal-log" element={<MealLogPage />} />
                            <Route path="/trends" element={<TrendsPage />} />
                            <Route path="/nutrition" element={<NutritionPage />} />
                            <Route path="/wellness-tips" element={<WellnessTipsPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/auth" element={<Auth />} />
                        </Routes>
                    </div>
                </Router>
            </MealProvider>
        </AuthProvider>
    );
};

export default App;
