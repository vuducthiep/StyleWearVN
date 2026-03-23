import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Save, X } from "lucide-react";
import Header from "../../../components/Header";
import vietnamAddressData from "../../../vietnamAddress.json";

interface Province {
    Id: string;
    Name: string;
    Districts: District[];
}

interface District {
    Id: string;
    Name: string;
    Wards: Ward[];
}

interface Ward {
    Id: string;
    Name: string;
    Level?: string;
}

interface UserRole {
    id?: number;
    name?: string;
}

interface UserProfile {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    gender: string;
    address: string;
    role?: string | UserRole;
    status: string;
    createdAt: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: UserProfile;
}

export default function ProfilePage() {
    const navigate = useNavigate();
    const vietnamAddress = vietnamAddressData as Province[];
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<'info' | 'address' | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        gender: "",
        address: "",
    });

    // Address selection state
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [detailedAddress, setDetailedAddress] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:8080/api/user/profile", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) {
                throw new Error("Không thể lấy thông tin người dùng");
            }

            const data: ApiResponse = await response.json();
            setProfile(data.data);
            setFormData({
                fullName: data.data.fullName,
                phoneNumber: data.data.phoneNumber,
                gender: data.data.gender,
                address: data.data.address || "",
            });
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditInfo = () => {
        setEditMode('info');
    };

    const handleEditAddress = () => {
        setEditMode('address');
    };

    const handleCancel = () => {
        if (editMode === 'info') {
            // Reset only personal info fields
            if (profile) {
                setFormData({
                    fullName: profile.fullName,
                    phoneNumber: profile.phoneNumber,
                    gender: profile.gender,
                    address: profile.address || "",
                });
            }
        } else if (editMode === 'address') {
            // Reset only address fields
            setSelectedProvince("");
            setSelectedDistrict("");
            setSelectedWard("");
            setDetailedAddress("");
        }
        setEditMode(null);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            let fullAddress = formData.address;

            // Jika sedang edit address, gabungkan dari selections
            if (editMode === 'address' && (selectedProvince || selectedDistrict || selectedWard || detailedAddress)) {
                const parts = [];
                if (detailedAddress) parts.push(detailedAddress);
                if (selectedWard) {
                    const wardName = getWardName(selectedWard);
                    if (wardName) parts.push(wardName);
                }
                if (selectedDistrict) {
                    const districtName = getDistrictName(selectedDistrict);
                    if (districtName) parts.push(districtName);
                }
                if (selectedProvince) {
                    const provinceName = getProvinceName(selectedProvince);
                    if (provinceName) parts.push(provinceName);
                }
                fullAddress = parts.join(", ");
            }

            const response = await fetch("http://localhost:8080/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    phoneNumber: formData.phoneNumber,
                    gender: formData.gender,
                    address: fullAddress,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Lỗi khi cập nhật thông tin");
            }

            const data: ApiResponse = await response.json();
            setProfile(data.data);
            setFormData({
                fullName: data.data.fullName,
                phoneNumber: data.data.phoneNumber,
                gender: data.data.gender,
                address: data.data.address || "",
            });
            setSelectedProvince("");
            setSelectedDistrict("");
            setSelectedWard("");
            setDetailedAddress("");
            setEditMode(null);
            alert("Cập nhật thành công!");
        } catch (err) {
            console.error("Error updating profile:", err);
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const getProvinceName = (provinceId: string) => {
        const province = vietnamAddress.find(p => p.Id === provinceId);
        return province?.Name || "";
    };

    const getDistrictName = (districtId: string) => {
        if (!selectedProvince) return "";
        const province = vietnamAddress.find(p => p.Id === selectedProvince);
        const district = province?.Districts.find(d => d.Id === districtId);
        return district?.Name || "";
    };

    const getWardName = (wardId: string) => {
        if (!selectedProvince || !selectedDistrict) return "";
        const province = vietnamAddress.find(p => p.Id === selectedProvince);
        const district = province?.Districts.find(d => d.Id === selectedDistrict);
        const ward = district?.Wards.find(w => w.Id === wardId);
        return ward?.Name || "";
    };

    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProvince(e.target.value);
        setSelectedDistrict("");
        setSelectedWard("");
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDistrict(e.target.value);
        setSelectedWard("");
    };

    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedWard(e.target.value);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const getProvincesForSelect = (): Province[] => vietnamAddress as Province[];

    const getDistrictsForSelect = (): District[] => {
        if (!selectedProvince) return [];
        const province = vietnamAddress.find(p => p.Id === selectedProvince);
        return province?.Districts || [];
    };

    const getWardsForSelect = (): Ward[] => {
        if (!selectedProvince || !selectedDistrict) return [];
        const province = vietnamAddress.find(p => p.Id === selectedProvince);
        const district = province?.Districts.find(d => d.Id === selectedDistrict);
        return district?.Wards || [];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getRoleName = (role?: string | UserRole) => {
        if (!role) return "N/A";
        if (typeof role === "string") return role;
        return role.name || "N/A";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>
                        <button
                            onClick={() => navigate("/")}
                            className="text-blue-600 font-semibold hover:underline"
                        >
                            Quay lại trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Page Title */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <User size={28} className="text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">Thông tin cá nhân</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-12 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                                <User size={48} className="text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{profile.fullName}</h2>
                                <p className="text-blue-100">{profile.email}</p>
                                <div className="flex gap-4 mt-2">
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                        {getRoleName(profile.role)}
                                    </span>
                                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                        {profile.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-8">
                        {editMode === null ? (
                            // View Mode
                            <div className="space-y-6">
                                {/* Edit Buttons */}
                                <div className="mb-6 flex gap-2">
                                    <button
                                        onClick={handleEditInfo}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Chỉnh sửa Thông tin
                                    </button>
                                    <button
                                        onClick={handleEditAddress}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Chỉnh sửa Địa chỉ
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                            Họ và tên
                                        </label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <User size={20} className="text-gray-400" />
                                            <p className="text-lg text-gray-900">{profile.fullName}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                            Email
                                        </label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <Mail size={20} className="text-gray-400" />
                                            <p className="text-lg text-gray-900">{profile.email}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                            Số điện thoại
                                        </label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <Phone size={20} className="text-gray-400" />
                                            <p className="text-lg text-gray-900">{profile.phoneNumber}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                            Giới tính
                                        </label>
                                        <div className="mt-2 flex items-center gap-3">
                                            <User size={20} className="text-gray-400" />
                                            <p className="text-lg text-gray-900">{profile.gender}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        Địa chỉ
                                    </label>
                                    <div className="mt-2 flex items-start gap-3">
                                        <MapPin size={20} className="text-gray-400 mt-1" />
                                        <p className="text-lg text-gray-900">
                                            {profile.address || "Chưa cập nhật"}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <p className="text-sm text-gray-600">
                                        Ngày tạo tài khoản: {formatDate(profile.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ) : editMode === 'info' ? (
                            // Edit Info Mode
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa Thông tin cá nhân</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Họ và tên *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email (không thể thay đổi)
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Số điện thoại *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Giới tính *
                                        </label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={18} />
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X size={18} />
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Edit Address Mode
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa Địa chỉ</h3>

                                {/* Address Selection */}
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        {/* Province */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                Tỉnh/Thành phố
                                            </label>
                                            <select
                                                value={selectedProvince}
                                                onChange={handleProvinceChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Chọn tỉnh/thành phố</option>
                                                {getProvincesForSelect().map((province) => (
                                                    <option key={province.Id} value={province.Id}>
                                                        {province.Name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* District */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                Quận/Huyện
                                            </label>
                                            <select
                                                value={selectedDistrict}
                                                onChange={handleDistrictChange}
                                                disabled={!selectedProvince}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Chọn quận/huyện</option>
                                                {getDistrictsForSelect().map((district) => (
                                                    <option key={district.Id} value={district.Id}>
                                                        {district.Name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Ward */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                                                Phường/Xã
                                            </label>
                                            <select
                                                value={selectedWard}
                                                onChange={handleWardChange}
                                                disabled={!selectedDistrict}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Chọn phường/xã</option>
                                                {getWardsForSelect().map((ward) => (
                                                    <option key={ward.Id} value={ward.Id}>
                                                        {ward.Name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Detailed Address */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">
                                            Địa chỉ chi tiết (Số nhà, đường, v.v.)
                                        </label>
                                        <textarea
                                            value={detailedAddress}
                                            onChange={(e) => setDetailedAddress(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nhập số nhà, tên đường, v.v."
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-6 border-t">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={18} />
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <X size={18} />
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
