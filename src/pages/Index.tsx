import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Dashboard from '@/components/Dashboard';
import { Monitor, Settings, Brain, Zap } from 'lucide-react';

const Index = () => {
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    
    if (area) {
      // Fetch filtered trains from backend
      fetch(`http://127.0.0.1:8000/trains/status?area=${area}`)
        .then(response => response.json())
        .then(data => {
          console.log(`Filtered trains for ${area}:`, data);
          setFilteredTrains(data.trains || []);
        })
        .catch(error => {
          console.error('Error fetching filtered trains:', error);
        });
    } else {
      setFilteredTrains([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rail-info flex items-center justify-center">
                <span className="text-background font-bold">R</span>
              </div>
              <span className="text-xl font-bold">Railvision</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="default" asChild>
                <Link to="/">
                  <Monitor className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/ml-predictions">
                  <Brain className="w-4 h-4 mr-2" />
                  ML Predictions
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/ai-decisions">
                  <Zap className="w-4 h-4 mr-2" />
                  AI Decisions
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/sandbox">
                  <Settings className="w-4 h-4 mr-2" />
                  Sandbox
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard */}
      <Dashboard 
        filteredTrains={filteredTrains}
        onAreaChange={handleAreaChange}
      />
    </div>
  );
};

export default Index;
