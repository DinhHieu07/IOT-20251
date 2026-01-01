import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Wind, Shield, BarChart3, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: Wind,
      title: 'Điều khiển thông minh',
      description: 'Hệ thống tự động điều chỉnh tốc độ quạt dựa trên nồng độ khí CO và nhiệt độ trong hầm gửi xe.',
    },
    {
      icon: Shield,
      title: 'An toàn cao',
      description: 'Giám sát liên tục chất lượng không khí, đảm bảo môi trường an toàn cho người sử dụng.',
    },
    {
      icon: BarChart3,
      title: 'Giám sát thời gian thực',
      description: 'Theo dõi và phân tích dữ liệu từ các cảm biến qua giao diện dashboard trực quan.',
    },
    {
      icon: Settings,
      title: 'Quản lý tập trung',
      description: 'Điều khiển và quản lý toàn bộ hệ thống quạt từ một nền tảng duy nhất.',
    },
  ];

  const benefits = [
    'Cải thiện chất lượng không khí trong hầm gửi xe',
    'Tiết kiệm năng lượng nhờ điều khiển thông minh',
    'Giảm nguy cơ tích tụ khí độc hại',
    'Tăng tuổi thọ thiết bị nhờ vận hành tối ưu',
    'Báo cáo và phân tích dữ liệu chi tiết',
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Hệ thống Quạt Thông gió
            <span className="block mt-2">Hầm Gửi xe Thông minh</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Giải pháp IoT hiện đại cho việc quản lý và điều khiển hệ thống thông gió trong hầm gửi xe, 
            đảm bảo chất lượng không khí và an toàn cho người sử dụng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-base">
              <Link to="/dashboard">
                <div className="flex items-center">
                  Xem Dashboard 
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link to="/devices">
                Quản lý Thiết bị
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tính năng nổi bật</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hệ thống được trang bị các công nghệ tiên tiến để đảm bảo hiệu quả và độ tin cậy cao
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-foreground" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Lợi ích của hệ thống</h2>
            <p className="text-muted-foreground text-lg">
              Những giá trị thiết thực mà hệ thống mang lại
            </p>
          </div>
          <Card className="border-border">
            <CardContent className="pt-6">
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-base text-foreground/90 leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Cách hoạt động</h2>
            <p className="text-muted-foreground text-lg">
              Hệ thống hoạt động dựa trên nguyên lý IoT và tự động hóa
            </p>
          </div>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Thu thập dữ liệu</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Các cảm biến liên tục đo đạc nồng độ CO, nhiệt độ, độ ẩm và các thông số môi trường khác trong hầm gửi xe.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Xử lý và phân tích</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Dữ liệu được gửi về server để xử lý, phân tích và đưa ra quyết định điều khiển phù hợp.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Điều khiển tự động</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Hệ thống tự động điều chỉnh tốc độ quạt hoặc bật/tắt quạt dựa trên ngưỡng an toàn đã được thiết lập.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Giám sát và báo cáo</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Người quản lý có thể theo dõi trạng thái hệ thống và xem báo cáo chi tiết qua giao diện web.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl sm:text-3xl mb-2">
                Sẵn sàng khám phá hệ thống?
              </CardTitle>
              <CardDescription className="text-base">
                Truy cập dashboard để xem dữ liệu thời gian thực và quản lý thiết bị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="text-base">
                <Link to="/dashboard">
                  <div className="flex items-center">
                  Bắt đầu ngay
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
