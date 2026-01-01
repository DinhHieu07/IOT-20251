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
          
          {/* Illustration Area - 2D Image Map */}
          <div className="relative w-full h-[400px] bg-slate-100 rounded-lg border border-slate-200 overflow-hidden group">
            {/* Background Image - Thay ảnh sơ đồ của bạn vào src bên dưới */}
            <img 
              src="src/res/breadboard.webp" 
              alt="Device Diagram" 
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            
            <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded shadow-sm text-sm font-medium text-slate-600">
              Chế độ xem 2D
            </div>

            {/* --- HOTSPOTS --- */}
            
            {/* MQ2 Sensor (Blue) */}
            <div 
              className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleIllustrationClick('sensors')}
            >
              <div className="w-20 h-20 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                MQ2
              </div>
              <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cảm biến Gas
              </div>
            </div>

            {/* MQ7 Sensor (Orange) */}
            <div 
              className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleIllustrationClick('sensors')}
            >
              <div className="w-20 h-20 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                MQ7
              </div>
              <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cảm biến CO
              </div>
            </div>

            {/* MQ135 Sensor (Gray) */}
            <div 
              className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleIllustrationClick('sensors')}
            >
              <div className="w-20 h-20 rounded-full bg-gray-500 shadow-lg shadow-gray-500/50 flex items-center justify-center text-white font-bold border-4 border-white text-xl">
                135
              </div>
              <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Chất lượng KK
              </div>
            </div>

            {/* Fan 1 */}
            <div 
              className="absolute bottom-[10%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleIllustrationClick('fans')}
            >
              <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center shadow-lg transition-colors ${
                fans[0].status === 'on' 
                  ? 'bg-green-100 border-green-500 text-green-600' 
                  : 'bg-red-100 border-red-500 text-red-600 animate-pulse'
              }`}>
                <Fan className="w-8 h-8" />
              </div>
              <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Quạt thông gió 1
              </div>
            </div>

            {/* Fan 2 */}
            <div 
              className="absolute bottom-[10%] right-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
              onClick={() => handleIllustrationClick('fans')}
            >
              <div className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center shadow-lg transition-colors ${
                fans[1].status === 'on' 
                  ? 'bg-green-100 border-green-500 text-green-600' 
                  : 'bg-red-100 border-red-500 text-red-600 animate-pulse'
              }`}>
                <Fan className="w-8 h-8" />
              </div>
              <div className="mt-2 bg-black/75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Quạt thông gió 2
              </div>
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

