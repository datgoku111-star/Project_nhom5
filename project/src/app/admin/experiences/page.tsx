"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Star, 
  X, 
  MapPin, 
  Users, 
  Compass, 
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  RefreshCw,
  DollarSign
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "@/shared/ButtonPrimary";
import ButtonThird from "@/shared/ButtonThird";
import Input from "@/shared/Input";
import {
  DEFAULT_LANGUAGE,
  isAppLanguage,
  toFormattingLocale,
} from "@/lib/locale";

interface Experience {
  id: string;
  title: string;
  location: string;
  price: number;
  image_url: string;
  guests: number;
  rating: number;
  review_count: number;
  city: string;
  created_at?: string;
}

type ExperienceFormError = {
  kind: "requiredFields" | "upload" | "imageRequired" | "save";
  message?: string;
};

export default function AdminExperiencesPage() {
  const { t, i18n } = useTranslation();
  const language = isAppLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;
  const formattingLocale = toFormattingLocale(language);
  const formatPrice = (price: number) =>
    new Intl.NumberFormat(formattingLocale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoadError, setHasLoadError] = useState(false);

  // States của Modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  // States của Form nhập liệu
  const [formTitle, setFormTitle] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPrice, setFormPrice] = useState(150);
  const [formGuests, setFormGuests] = useState(6);
  const [formRating, setFormRating] = useState(4.5);
  const [formReviewCount, setFormReviewCount] = useState(120);
  const [formCity, setFormCity] = useState("New York");
  const [formImageUrl, setFormImageUrl] = useState("");
  
  // States tải lên ảnh
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<ExperienceFormError | null>(null);

  const getFormErrorMessage = (error: ExperienceFormError) => {
    switch (error.kind) {
      case "requiredFields":
        return t("adminExperiencesRequiredFields");
      case "upload":
        return t("adminExperiencesUploadError", { message: error.message });
      case "imageRequired":
        return t("adminExperiencesImageRequired");
      case "save":
        return t("adminExperiencesSaveError", { message: error.message });
    }
  };

  // Dữ liệu mẫu (Fallback data)
  const fallbackExperiences: Experience[] = [
    {
      id: "mock-1",
      title: "Generate Interactive Markets",
      location: "2 Warner Alley",
      price: 200,
      image_url: "https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
      guests: 10,
      rating: 4.4,
      review_count: 478,
      city: "New York"
    },
    {
      id: "mock-2",
      title: "deliver dynamic e-services",
      location: "620 Clove Park",
      price: 249,
      image_url: "https://images.pexels.com/photos/6455686/pexels-photo-6455686.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
      guests: 6,
      rating: 3.2,
      review_count: 566,
      city: "New York"
    },
    {
      id: "mock-3",
      title: "productize holistic deliverables",
      location: "5 Butterfield Avenue",
      price: 88,
      image_url: "https://images.pexels.com/photos/5560867/pexels-photo-5560867.jpeg?auto=compress&cs=tinysrgb&dpr=3&h=750&w=1260",
      guests: 6,
      rating: 3.5,
      review_count: 147,
      city: "Tokyo"
    },
    {
      id: "mock-4",
      title: "deploy integrated solutions",
      location: "11204 Lawn Court",
      price: 47,
      image_url: "https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200",
      guests: 9,
      rating: 3.0,
      review_count: 257,
      city: "Tokyo"
    },
    {
      id: "mock-5",
      title: "evolve virtual models",
      location: "39 Del Sol Lane",
      price: 187,
      image_url: "https://images.pexels.com/photos/1094794/pexels-photo-1094794.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
      guests: 10,
      rating: 4.4,
      review_count: 132,
      city: "Paris"
    },
    {
      id: "mock-6",
      title: "seize killer e-commerce",
      location: "45539 Kensington Drive",
      price: 179,
      image_url: "https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200",
      guests: 9,
      rating: 4.6,
      review_count: 275,
      city: "Paris"
    },
    {
      id: "mock-7",
      title: "generate proactive ROI",
      location: "9 Jenifer Way",
      price: 275,
      image_url: "https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200",
      guests: 10,
      rating: 3.4,
      review_count: 20,
      city: "London"
    },
    {
      id: "mock-8",
      title: "aggregate out-of-the-box channels",
      location: "5 Aberg Place",
      price: 270,
      image_url: "https://a0.muscache.com/im/pictures/lombard/MtTemplate-1435866-media_library/original/38d6b5ea-abcc-4876-acb4-e5b79586c37c.jpeg?im_w=1200",
      guests: 9,
      rating: 4.9,
      review_count: 268,
      city: "London"
    }
  ];

  // Tải danh sách experiences từ Supabase
  const fetchExperiences = async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      const { data, error } = await supabaseBrowser
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setExperiences(data);
      } else {
        setExperiences(fallbackExperiences);
      }
    } catch (err: any) {
      console.warn("Lỗi fetch experiences, hiển thị dữ liệu demo:", err.message);
      setHasLoadError(true);
      setExperiences(fallbackExperiences);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  // Mở Modal Thêm mới
  const handleOpenAddModal = () => {
    setEditingExperience(null);
    setFormTitle("");
    setFormLocation("");
    setFormPrice(150);
    setFormGuests(6);
    setFormRating(4.5);
    setFormReviewCount(120);
    setFormCity("New York");
    setFormImageUrl("");
    setImageFile(null);
    setFormError(null);
    setIsOpenModal(true);
  };

  // Mở Modal Chỉnh sửa
  const handleOpenEditModal = (exp: Experience) => {
    setEditingExperience(exp);
    setFormTitle(exp.title);
    setFormLocation(exp.location);
    setFormPrice(exp.price);
    setFormGuests(exp.guests);
    setFormRating(exp.rating);
    setFormReviewCount(exp.review_count);
    setFormCity(exp.city);
    setFormImageUrl(exp.image_url);
    setImageFile(null);
    setFormError(null);
    setIsOpenModal(true);
  };

  // Tải ảnh lên Supabase Storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `experiences/${fileName}`;

    // Upload file lên bucket 'experience-images'
    const { error: uploadError } = await supabaseBrowser
      .storage
      .from("experience-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabaseBrowser
      .storage
      .from("experience-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Lưu dữ liệu
  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formTitle.trim() || !formLocation.trim()) {
      setFormError({ kind: "requiredFields" });
      return;
    }

    setUploadingImage(true);

    try {
      let finalImageUrl = formImageUrl;

      if (imageFile) {
        try {
          finalImageUrl = await uploadImageToStorage(imageFile);
        } catch (uploadErr: any) {
          setFormError({ kind: "upload", message: uploadErr.message });
          return;
        }
      }

      if (!finalImageUrl) {
        setFormError({ kind: "imageRequired" });
        return;
      }

      const experienceData = {
        title: formTitle,
        location: formLocation,
        price: Number(formPrice),
        image_url: finalImageUrl,
        guests: Number(formGuests),
        rating: Number(formRating),
        review_count: Number(formReviewCount),
        city: formCity,
      };

      if (editingExperience) {
        if (editingExperience.id.startsWith("mock-")) {
          setExperiences(prev => prev.map(e => e.id === editingExperience.id ? { ...e, ...experienceData } : e));
        } else {
          const { error } = await supabaseBrowser
            .from("experiences")
            .update(experienceData)
            .eq("id", editingExperience.id);

          if (error) throw error;
          await fetchExperiences();
        }
      } else {
        if (experiences.some(e => e.id.startsWith("mock-"))) {
          const newMock: Experience = {
            id: "mock-" + Math.random().toString(36).substring(2, 9),
            ...experienceData
          };
          setExperiences(prev => [newMock, ...prev]);
        } else {
          const { error } = await supabaseBrowser
            .from("experiences")
            .insert([experienceData]);

          if (error) throw error;
          await fetchExperiences();
        }
      }

      setIsOpenModal(false);
    } catch (err: any) {
      console.error("Lỗi khi lưu trải nghiệm:", err);
      setFormError({ kind: "save", message: err.message });
    } finally {
      setUploadingImage(false);
    }
  };

  // Xóa trải nghiệm
  const handleDeleteExperience = async (id: string) => {
    if (!confirm(t("adminExperiencesConfirmDelete"))) return;

    try {
      if (id.startsWith("mock-")) {
        setExperiences(prev => prev.filter(e => e.id !== id));
      } else {
        const { error } = await supabaseBrowser
          .from("experiences")
          .delete()
          .eq("id", id);

        if (error) throw error;
        await fetchExperiences();
      }
    } catch (err: any) {
      alert(t("adminExperiencesDeleteError", { message: err.message }));
    }
  };

  const filteredExperiences = experiences.filter(exp => 
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-neutral-50/50 dark:bg-neutral-900/40 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center space-x-3">
            <Compass className="w-8 h-8 text-primary-600" />
            <span>{t("adminExperiencesTitle")}</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1.5 text-sm">
            {t("adminExperiencesSubtitle")}
          </p>
        </div>
        <ButtonPrimary onClick={handleOpenAddModal} className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>{t("adminExperiencesAdd")}</span>
        </ButtonPrimary>
      </div>

      {/* DB Connection Alert */}
      {hasLoadError && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl flex items-center space-x-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <span>{t("adminExperiencesLoadFallback")}</span>
          <button 
            onClick={fetchExperiences} 
            className="ml-auto underline flex items-center space-x-1 hover:text-amber-950 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("adminExperiencesRetry")}</span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200/80 dark:border-neutral-700 items-center justify-between">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder={t("adminExperiencesSearchPlaceholder")}
            className="block w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-900 dark:text-white font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4.5 w-16 text-center">{t("adminExperiencesColumnNumber")}</th>
                <th scope="col" className="px-6 py-4.5">{t("adminExperiencesColumnCover")}</th>
                <th scope="col" className="px-6 py-4.5">{t("adminExperiencesColumnName")}</th>
                <th scope="col" className="px-6 py-4.5">{t("adminExperiencesColumnLocation")}</th>
                <th scope="col" className="px-6 py-4.5">{t("adminExperiencesColumnCity")}</th>
                <th scope="col" className="px-6 py-4.5">{t("adminExperiencesColumnPrice")}</th>
                <th scope="col" className="px-6 py-4.5 text-center">{t("adminExperiencesColumnGuests")}</th>
                <th scope="col" className="px-6 py-4.5 text-center">{t("adminExperiencesColumnRating")}</th>
                <th scope="col" className="px-6 py-4.5 text-right">{t("adminExperiencesColumnActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-6 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="w-14 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-36"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-28"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-10 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-10 mx-auto"></div></td>
                    <td className="px-6 py-4.5"><div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredExperiences.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-neutral-500 dark:text-neutral-400 font-medium">
                    {t("adminExperiencesEmpty")}
                  </td>
                </tr>
              ) : (
                filteredExperiences.map((exp, index) => (
                  <tr key={exp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/10 transition-colors">
                    <td className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img 
                        src={exp.image_url} 
                        alt={exp.title} 
                        className="w-14 h-10 object-cover rounded-lg border border-neutral-200/50 dark:border-neutral-700 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1556086771259-6a8506099945?w=200";
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-neutral-900 dark:text-white capitalize">
                      {exp.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-neutral-500 dark:text-neutral-400 space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{exp.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {exp.city}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-neutral-900 dark:text-white">
                      {formatPrice(exp.price)}
                      <span className="text-[10px] text-neutral-400 font-normal"> {t("adminExperiencesPerPerson")}</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap text-neutral-600 dark:text-neutral-300 font-semibold">
                      <div className="flex items-center justify-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{t("adminExperiencesGuestCapacity", { count: exp.guests })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center text-yellow-500 font-bold space-x-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500" />
                        <span>{exp.rating}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">({exp.review_count})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t("adminExperiencesEdit")}
                          aria-label={t("adminExperiencesEdit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t("adminExperiencesDelete")}
                          aria-label={t("adminExperiencesDelete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative animate-scale-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {editingExperience
                  ? t("adminExperiencesEditTitle")
                  : t("adminExperiencesAddTitle")}
              </h3>
              <button 
                onClick={() => setIsOpenModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title={t("adminExperiencesClose")}
                aria-label={t("adminExperiencesClose")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExperience} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
                  {getFormErrorMessage(formError)}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {t("adminExperiencesNameField")} <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text" 
                  value={formTitle} 
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t("adminExperiencesNamePlaceholder")}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  {t("adminExperiencesLocationField")} <span className="text-red-500">*</span>
                </label>
                <Input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder={t("adminExperiencesLocationPlaceholder")}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t("adminExperiencesCityField")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="block w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white font-medium"
                    required
                  >
                    <option value="New York">New York</option>
                    <option value="Tokyo">Tokyo</option>
                    <option value="Paris">Paris</option>
                    <option value="London">London</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t("adminExperiencesPriceField")} <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    type="number" 
                    value={formPrice} 
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t("adminExperiencesGuestsField")}
                  </label>
                  <Input 
                    type="number" 
                    value={formGuests} 
                    onChange={(e) => setFormGuests(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t("adminExperiencesRatingField")}
                  </label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={formRating} 
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    min={1}
                    max={5}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {t("adminExperiencesReviewCountField")}
                  </label>
                  <Input 
                    type="number" 
                    value={formReviewCount} 
                    onChange={(e) => setFormReviewCount(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-semibold flex items-center space-x-1">
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-450" />
                  <span>{t("adminExperiencesImageField")}</span>
                </label>
                
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100/40 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    id="image-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setFormImageUrl("");
                      }
                    }}
                  />
                  <label htmlFor="image-file-input" className="cursor-pointer text-center space-y-1">
                    <ImageIcon className="mx-auto h-8 w-8 text-neutral-400" />
                    <span className="block text-[11px] text-neutral-600 dark:text-neutral-400 font-bold">
                      {imageFile
                        ? t("adminExperiencesSelectedFile", { name: imageFile.name })
                        : t("adminExperiencesUploadPrompt")}
                    </span>
                    <span className="block text-[10px] text-neutral-400">{t("adminExperiencesUploadHint")}</span>
                  </label>
                </div>

                <div className="mt-2 text-center text-neutral-400 text-[10px] font-bold">{t("adminExperiencesImageUrlLabel")}</div>
                <Input 
                  type="text" 
                  value={formImageUrl} 
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    setImageFile(null);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-150 dark:border-neutral-750">
                <ButtonThird type="button" onClick={() => setIsOpenModal(false)}>{t("adminExperiencesCancel")}</ButtonThird>
                <ButtonPrimary type="submit" disabled={uploadingImage} className="flex items-center space-x-2">
                  {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>
                    {editingExperience
                      ? t("adminExperiencesUpdate")
                      : t("adminExperiencesCreate")}
                  </span>
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
