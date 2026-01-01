import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../../components/ui/accordion';
import { Fan, Thermometer, Wind, Activity, Power, Zap, Clock, Settings, Save } from 'lucide-react';

const Devices = () => {
  const [activeAccordion, setActiveAccordion] = useState("");
  const [editMode, setEditMode] = useState({});

  // Mock Data for Sensors
  const [sensors, setSensors] = useState([
    { 
      id: 'mq2', 
      name: 'Cảm biến Khí Gas (MQ2)', 
      value: '450 ppm', 
      status: 'normal', 
      lastUpdated: '10:30:05',
      threshold: { min: 200, max: 1000 },
      location: 'Pin A0',
      description: 'Phát hiện khí gas, khói'
    },
    { 
      id: 'mq7', 
      name: 'Cảm biến CO (MQ7)', 
      value: '15 ppm', 
      status: 'normal', 
      lastUpdated: '10:30:05',
      threshold: { min: 0, max: 50 },
      location: 'Pin A1',
      description: 'Phát hiện khí Carbon Monoxide'
    },
    { 
      id: 'mq135', 
      name: 'Cảm biến Chất lượng KK (MQ135)', 
      value: 'Good', 
      status: 'normal', 
      lastUpdated: '10:30:05',
      threshold: { min: 0, max: 100 },
      location: 'Pin A2',
      description: 'Đo chất lượng không khí tổng hợp'
    }
  ]);

  // Mock Data for Fans
  const [fans, setFans] = useState([
    { 
      id: 'fan1', 
      name: 'Quạt thông gió 1', 
      status: 'on', 
      speed: 'Level 2', 
      mode: 'Auto',
      power: '45W',
      runtime: '120h',
      location: 'Cửa sổ trái'
    },
    { 
      id: 'fan2', 
      name: 'Quạt thông gió 2', 
      status: 'off', 
      speed: '0', 
      mode: 'Manual',
      power: '0W',
      runtime: '45h',
      location: 'Cửa sổ phải'
    }
  ]);

  const handleIllustrationClick = (id) => {
    setActiveAccordion(id);
  };

  const toggleEditMode = (id) => {
    setEditMode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleThresholdChange = (id, type, value) => {
    setSensors(sensors.map(s => 
      s.id === id ? { ...s, threshold: { ...s.threshold, [type]: parseInt(value) } } : s
    ));
  };

  const handleTurnOffAllFans = () => {
    setFans(fans.map(f => ({ ...f, status: 'off', speed: '0', power: '0W' })));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      case 'on': return 'bg-green-500';
      case 'off': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý Thiết bị</h1>
        <p className="text-muted-foreground">
          Cấu hình và giám sát các thiết bị phần cứng
        </p>
      </div>

      {/* Main Device Container */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="h-6 w-6" />
            Thiết bị chính (Main Controller)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Illustration Area */}
          <div className="relative w-full h-64 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-lg font-medium">Khu vực hình minh họa 2D/3D</span>
            </div>
            
            {/* Interactive Hotspots (Mockup) */}
            {/* Sensor Group Hotspot */}
            <div 
              className="absolute top-1/4 left-1/4 w-24 h-24 bg-blue-500/20 border-2 border-blue-500 rounded-full cursor-pointer hover:bg-blue-500/40 transition-all flex items-center justify-center group"
              onClick={() => handleIllustrationClick('sensors')}
            >
              <span className="text-xs font-bold text-blue-700 bg-white/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Cảm biến</span>
            </div>

            {/* Fan Group Hotspot */}
            <div 
              className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-green-500/20 border-2 border-green-500 rounded-lg cursor-pointer hover:bg-green-500/40 transition-all flex items-center justify-center group"
              onClick={() => handleIllustrationClick('fans')}
            >
              <span className="text-xs font-bold text-green-700 bg-white/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Quạt làm mát</span>
            </div>
          </div>

          {/* Accordions */}
          <Accordion type="single" collapsible value={activeAccordion} onValueChange={setActiveAccordion} className="w-full">
            
            {/* Sensors Group */}
            <AccordionItem value="sensors">
              <AccordionTrigger className="text-lg font-semibold text-blue-600">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Nhóm Cảm biến (Sensors)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-3 pt-4">
                  {sensors.map((sensor) => (
                    <Card key={sensor.id} className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-medium">{sensor.name}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(sensor.status) + " text-white border-none"}>
                            {sensor.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">{sensor.value}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Cập nhật:</span>
                            <span>{sensor.lastUpdated}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Ngưỡng:</span>
                            {editMode[sensor.id] ? (
                              <div className="flex gap-2 items-center">
                                <Input 
                                  type="number" 
                                  className="h-6 w-16 text-xs" 
                                  value={sensor.threshold.min}
                                  onChange={(e) => handleThresholdChange(sensor.id, 'min', e.target.value)}
                                />
                                <span>-</span>
                                <Input 
                                  type="number" 
                                  className="h-6 w-16 text-xs" 
                                  value={sensor.threshold.max}
                                  onChange={(e) => handleThresholdChange(sensor.id, 'max', e.target.value)}
                                />
                              </div>
                            ) : (
                              <span>{sensor.threshold.min} - {sensor.threshold.max}</span>
                            )}
                          </div>
                          <div className="flex justify-between">
                            <span>Vị trí:</span>
                            <span>{sensor.location}</span>
                          </div>
                          <div className="pt-2 border-t mt-2 flex justify-between items-center">
                            <span className="text-[10px]">{sensor.description}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                              onClick={() => toggleEditMode(sensor.id)}
                            >
                              {editMode[sensor.id] ? <Save className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Fans Group */}
            <AccordionItem value="fans">
              <AccordionTrigger className="text-lg font-semibold text-green-600">
                <div className="flex items-center gap-2">
                  <Fan className="h-5 w-5" />
                  Nhóm Quạt (Fans)
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end pt-2 px-1">
                  <Button variant="destructive" size="sm" onClick={handleTurnOffAllFans}>
                    <Power className="h-4 w-4 mr-2" />
                    Tắt tất cả quạt
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  {fans.map((fan) => (
                    <Card key={fan.id} className="bg-slate-50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-medium">{fan.name}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(fan.status) + " text-white border-none"}>
                            {fan.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Wind className="h-4 w-4" /> Tốc độ
                            </div>
                            <div className="font-semibold">{fan.speed}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Settings className="h-4 w-4" /> Chế độ
                            </div>
                            <div className="font-semibold">{fan.mode}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Zap className="h-4 w-4" /> Công suất
                            </div>
                            <div className="font-semibold">{fan.power}</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" /> Thời gian chạy
                            </div>
                            <div className="font-semibold">{fan.runtime}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                          <Button size="sm" variant="outline">Cấu hình</Button>
                          <Button size="sm" variant={fan.status === 'on' ? "destructive" : "default"}>
                            {fan.status === 'on' ? 'Tắt thiết bị' : 'Bật thiết bị'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

function ServerIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  )
}

export default Devices;

