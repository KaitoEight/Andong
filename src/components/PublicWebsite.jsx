import React, { useState, useEffect, useRef } from "react";
import {
  Calendar, Phone, MapPin, Clock, ShieldCheck, Award, Star, CheckCircle, ChevronRight,
  Sparkles, ArrowRight, Heart, Users, MessageSquare, Check, User, Activity, LogIn, Lock
} from "lucide-react";
import { uid, todayStr, fmtVND } from "../utils/helpers";

// Hook kích hoạt hiệu ứng cuộn trang (Scroll Reveal Animation)
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-active");
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

export default function PublicWebsite({ onGoInternal, data, setData }) {
  useScrollReveal();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab]           = useState("implant");
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingForm, setBookingForm]       = useState({
    name: "",
    phone: "",
    service: "Niềng răng Chỉnh nha",
    doctor: "Bác sĩ Nguyễn Văn Nam",
    date: todayStr(),
    time: "09:00",
    note: "",
  });

  // Đồng bộ thanh cuộn trang (Scroll Progress Bar)
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên và Số điện thoại.");
      return;
    }

    // Tự động tạo hồ sơ khách hàng & lịch hẹn thật vào hệ thống
    if (setData && data) {
      const custId = uid("c");
      const custCode = "KH" + String((data.customers || []).length + 1).padStart(4, "0");
      const newCust = {
        id: custId,
        code: custCode,
        name: bookingForm.name.trim(),
        phone: bookingForm.phone.trim(),
        gender: "Nam",
        dob: "1995-01-01",
        address: "Đăng ký Online từ Website",
        createdAt: todayStr(),
      };

      const newAppt = {
        id: uid("ap"),
        code: "LH" + String((data.appts || []).length + 1).padStart(3, "0"),
        customerId: custId,
        customerName: bookingForm.name.trim(),
        customerCode: custCode,
        phone: bookingForm.phone.trim(),
        date: bookingForm.date,
        time: bookingForm.time,
        doctor: bookingForm.doctor,
        service: bookingForm.service,
        status: "Xác nhận",
        note: bookingForm.note || "Đặt hẹn trực tuyến qua Website Victoria Dental",
      };

      setData({
        ...data,
        customers: [newCust, ...(data.customers || [])],
        appts: [newAppt, ...(data.appts || [])],
      });
    }

    setBookingSuccess(true);
  };

  const SERVICES_LIST = [
    {
      id: "implant",
      title: "Cấy Ghép Implant Thụy Sĩ",
      tagline: "Phục hồi răng đã mất hoàn hảo như răng thật 100%",
      price: "Từ 12.500.000 VNĐ / Trụ",
      features: ["Tích hợp xương cấp tốc", "Bảo hành trọn đời", "Không đau, không sưng", "Ăn nhai bền chắc"],
      desc: "Công nghệ cấy ghép Implant kỹ thuật số định vị 3D giúp quá trình cấy ghép diễn ra an toàn, chính xác tuyệt đối.",
    },
    {
      id: "ortho",
      title: "Niềng Răng Thẩm Mỹ Invisalign",
      tagline: "Khay niềng trong suốt Thụy Sĩ — Tự tin giao tiếp",
      price: "Ưu đãi giảm 30% gói niềng",
      features: ["Thẩm mỹ vô hình", "Rút ngắn 6 tháng", "Tháo lắp dễ dàng", "Xem trước kết quả 3D"],
      desc: "Hệ thống chỉnh nha kỹ thuật số ClinCheck giúp biết trước kết quả nụ cười sau niềng chuẩn từng milimet.",
    },
    {
      id: "veneer",
      title: "Bọc Răng Sứ & Dán Veneer",
      tagline: "Kiến tạo nụ cười chuẩn tỷ lệ vàng Hoàng Gia",
      price: "Từ 2.500.000 VNĐ / Răng",
      features: ["Sứ nén nguyên khối cao cấp", "Mỏng nhẹ không mài nhỏ", "Trắng sáng tự nhiên", "Bảo hành 15 năm"],
      desc: "Chất liệu sứ cao cấp chính hãng từ Đức và Thụy Sĩ mang lại độ trong bóng tự nhiên và độ bền gấp 5 lần răng thật.",
    },
    {
      id: "whitening",
      title: "Tẩy Trắng Răng Laser Whitening",
      tagline: "Bật 3-5 tông răng trắng sáng chỉ sau 45 phút",
      price: "1.800.000 VNĐ / Liệu trình",
      features: ["Công nghệ Laser lạnh", "Không ê buốt nướu", "An toàn tuyệt đối", "Duy trì từ 2-3 năm"],
      desc: "Laser Whitening kết hợp thuốc tẩy trắng đạt chuẩn FDA Hoa Kỳ giúp loại bỏ mảng bám ố vàng nhanh chóng.",
    },
  ];

  const DOCTORS = [
    {
      name: "ThS. BS. Nguyễn Văn Nam",
      title: "Giám đốc Chuyên môn Implant & Phục hình",
      exp: "15 năm kinh nghiệm",
      edu: "Thạc sĩ Răng Hàm Mặt — ĐH Y Dược, Chứng chỉ Implant ITI Thụy Sĩ",
    },
    {
      name: "BS. CKI. Lê Thị Hoa",
      title: "Trưởng khoa Niềng răng & Chỉnh nha",
      exp: "12 năm kinh nghiệm",
      edu: "Chuyên gia Invisalign Certified Platinum, Chứng chỉ Ortho Hoa Kỳ",
    },
    {
      name: "BS. Tran Minh Đức",
      title: "Chuyên gia Răng sứ & Phẫu thuật Nha chu",
      exp: "10 năm kinh nghiệm",
      edu: "Tốt nghiệp Thủ khoa RHM, Thành viên Hội Nha khoa Thẩm mỹ Quốc tế AAD",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Scroll Progress Top Indicator Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ── Header Navbar ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 grid place-items-center font-extrabold text-2xl shadow-lg shadow-emerald-500/20 font-heading">
              V
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight font-heading flex items-center gap-2">
                VICTORIA DENTAL
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  5★ Swiss Standard
                </span>
              </span>
              <p className="text-[11px] text-slate-400">Viện Nha Khoa Thẩm Mỹ Quốc Tế</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#dich-vu" className="hover:text-emerald-400 transition">Dịch Vụ</a>
            <a href="#ve-chung-toi" className="hover:text-emerald-400 transition">Về Chúng Tôi</a>
            <a href="#bac-si" className="hover:text-emerald-400 transition">Đội Ngũ Bác Sĩ</a>
            <a href="#lot-xac" className="hover:text-emerald-400 transition">Kết Quả Nụ Cười</a>
            <a href="#lien-he" className="hover:text-emerald-400 transition">Liên Hệ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoInternal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition"
              title="Đăng nhập cổng quản trị nội bộ"
            >
              <LogIn size={14} className="text-emerald-400" /> Hệ Thống Nội Bộ
            </button>

            <a
              href="#dat-lich"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
            >
              <Calendar size={15} /> Đặt Lịch Khám Online
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        {/* Glow background mesh circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left reveal-on-scroll">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Sparkles size={14} /> Công Nghệ Nha Khoa Thụy Sĩ Thế Hệ Mới 2026
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white font-heading leading-[1.15] tracking-tight">
              Kiến Tạo <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Nụ Cười Hoàng Gia</span>, Nâng Tầm Cuộc Sống
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Trải nghiệm dịch vụ nha khoa tiêu chuẩn 5 sao Thụy Sĩ. Đội ngũ Thạc sĩ - Bác sĩ trên 15 năm kinh nghiệm, công nghệ cấy ghép Implant 3D & Niềng răng vô hình không đau, bảo hành trọn đời.
            </p>

            {/* Quick Hero Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <ShieldCheck size={16} className="text-emerald-400" /> Khám & Tư Vấn Mẫu 3D Miễn Phí
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <Award size={16} className="text-teal-400" /> Cam Kết Không Đau & Bảo Hành Trọn Đời
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-heading">15.000+</div>
                <div className="text-[11px] text-slate-400">Khách Hàng Nụ Cười</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-heading">99.8%</div>
                <div className="text-[11px] text-slate-400">Tỷ Lệ Hài Lòng</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-heading">15+ Năm</div>
                <div className="text-[11px] text-slate-400">Kinh Nghiệm Chuyên Khoa</div>
              </div>
            </div>
          </div>

          {/* Hero Right Quick Booking Widget */}
          <div id="dat-lich" className="lg:col-span-5 reveal-on-scroll">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/90 backdrop-blur-2xl border border-slate-700/80 shadow-2xl shadow-emerald-950/40 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
                <div>
                  <h3 className="font-bold text-white text-lg font-heading flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-400" /> Đặt Lịch Hẹn Khám Nhanh
                  </h3>
                  <p className="text-xs text-slate-400">Miễn phí 100% chi phí chụp phim 3D & tư vấn bác sĩ</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                  HOT DEAL -30%
                </span>
              </div>

              {bookingSuccess ? (
                <div className="p-6 text-center space-y-4 animate-fade">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center mx-auto border border-emerald-500/40">
                    <CheckCircle size={36} />
                  </div>
                  <h4 className="font-bold text-white text-base">Đặt Lịch Hẹn Thành Công!</h4>
                  <p className="text-xs text-slate-300">
                    Cảm ơn bạn <b>{bookingForm.name}</b>. Đội ngũ tư vấn Victoria Dental sẽ liên hệ xác nhận lịch hẹn trong vòng 5 phút qua SĐT <b>{bookingForm.phone}</b>.
                  </p>
                  <button
                    onClick={() => setBookingSuccess(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition"
                  >
                    Đặt Lịch Cho Người Thân
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Họ và tên khách hàng *</label>
                    <input
                      required
                      type="text"
                      placeholder="Nhập họ và tên..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Số điện thoại *</label>
                    <input
                      required
                      type="tel"
                      placeholder="0988 000 000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Dịch vụ quan tâm</label>
                      <select
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                        value={bookingForm.service}
                        onChange={(e) => setBookingForm({ ...bookingForm, service: e.target.value })}
                      >
                        <option>Niềng răng Chỉnh nha</option>
                        <option>Cấy ghép Implant Thụy Sĩ</option>
                        <option>Răng sứ Thẩm mỹ Veneer</option>
                        <option>Tẩy trắng răng Laser</option>
                        <option>Nha khoa tổng quát</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ngày mong muốn</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-emerald-400 transition"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Gửi Đăng Ký Lịch Khám Miễn Phí
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services Section (Scroll Animated Grid) ────────────────────────── */}
      <section id="dich-vu" className="py-20 bg-slate-950/60 border-t border-b border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 reveal-on-scroll">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Dịch Vụ Đạt Chuẩn Hoàng Gia
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Giải Pháp Nha Khoa Thẩm Mỹ Toàn Diện
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Được thực hiện bởi đội ngũ bác sĩ chuyên khoa với sự hỗ trợ của hệ thống trang thiết bị chẩn đoán 3D hiện đại nhất thế giới.
            </p>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES_LIST.map((svc) => (
              <div
                key={svc.id}
                className="group p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between reveal-on-scroll"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 grid place-items-center border border-emerald-500/20 group-hover:scale-110 transition">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg font-heading group-hover:text-emerald-400 transition">{svc.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{svc.tagline}</p>
                  </div>
                  <p className="text-xs text-slate-300 font-normal leading-relaxed">{svc.desc}</p>
                  <ul className="space-y-1.5 pt-2">
                    {svc.features.map((f, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                        <Check size={13} className="text-emerald-400 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">{svc.price}</span>
                  <a href="#dat-lich" className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-emerald-400 group-hover:text-slate-950 transition">
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before & After Smile Interactive Slider ─────────────────────── */}
      <section id="lot-xac" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3 reveal-on-scroll">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Kết Quả Nụ Cười Thực Tế
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Hành Trình Lột Xác 15.000+ Nụ Cười
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Xem trước sự thay đổi diệu kỳ của nụ cười trước và sau khi điều trị tại Victoria Dental.
            </p>
          </div>

          {/* Before / After Interactive Visual Card */}
          <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-slate-800/80 border border-slate-700/80 shadow-2xl reveal-on-scroll space-y-4">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden select-none">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center text-center p-8">
                <div className="space-y-3 max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <Award size={14} /> Nụ Cười Tự Tin — Răng Trắng Sáng Tự Nhiên
                  </div>
                  <h3 className="text-2xl font-bold text-white font-heading">Đạt Tỷ Lệ Tỷ Lệ Vàng 1:1.618</h3>
                  <p className="text-xs text-slate-300">
                    Công nghệ Smile Design 3D cá nhân hóa dáng răng phù hợp với khuôn mặt và góc hàm của từng khách hàng.
                  </p>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 flex items-center gap-3 text-xs font-bold text-slate-300">
                <span>Trước điều trị</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={beforeAfterPos}
                  onChange={(e) => setBeforeAfterPos(e.target.value)}
                  className="w-32 accent-emerald-400 cursor-pointer"
                />
                <span className="text-emerald-400">Sau điều trị ({beforeAfterPos}%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Doctor Team Section ─────────────────────────────────────────── */}
      <section id="bac-si" className="py-20 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3 reveal-on-scroll">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Đội Ngũ Chuyên Gia
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              Các Thạc Sĩ — Bác Sĩ Hàng Đầu
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              100% bác sĩ có bằng Thạc sĩ chuyên khoa Răng Hàm Mặt, tu nghiệp chuyên sâu tại Thụy Sĩ, Đức và Hoa Kỳ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DOCTORS.map((doc, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 shadow-xl reveal-on-scroll space-y-4 transition hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white grid place-items-center font-extrabold text-2xl shadow-lg shadow-emerald-600/20">
                  {doc.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg font-heading">{doc.name}</h3>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">{doc.title}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 text-xs space-y-1 text-slate-300">
                  <div><b>Kinh nghiệm:</b> {doc.exp}</div>
                  <div className="text-[11px] text-slate-400">{doc.edu}</div>
                </div>
                <a
                  href="#dat-lich"
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-xs font-bold text-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Calendar size={14} /> Đặt Lịch Với Bác Sĩ
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer & Contact ────────────────────────────────────────────── */}
      <footer id="lien-he" className="bg-slate-950 border-t border-slate-800/80 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 grid place-items-center font-bold text-base font-heading">V</div>
              <span className="font-bold text-white text-base font-heading">VICTORIA DENTAL</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Viện Nha Khoa Thẩm Mỹ Quốc Tế Victoria — Tiêu chuẩn 5 sao Thụy Sĩ. Đem lại nụ cười tự tin và sức khỏe răng miệng toàn diện.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs font-heading mb-3 uppercase tracking-wider">Thời Gian Làm Việc</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Thứ 2 - Thứ 7: 08:00 - 20:00</li>
              <li>Chủ Nhật: 08:00 - 17:00</li>
              <li className="text-emerald-400 font-bold">Trực cấp cứu 24/7 Hotline</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs font-heading mb-3 uppercase tracking-wider">Liên Hệ Khám</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5"><Phone size={13} className="text-emerald-400" /> Hotline: 1900 1234 - 0988 999 888</li>
              <li className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-400" /> Trụ sở: Victoria HeadOffice Center</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs font-heading mb-3 uppercase tracking-wider">Hệ Thống Dành Cho Bác Sĩ</h4>
            <button
              onClick={onGoInternal}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Lock size={14} /> Đăng Nhập Cổng Quản Trị
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-900 text-center text-[11px] text-slate-500">
          © 2026 Victoria Dental International. All rights reserved. Tiêu chuẩn Thụy Sĩ 5★.
        </div>
      </footer>
    </div>
  );
}
