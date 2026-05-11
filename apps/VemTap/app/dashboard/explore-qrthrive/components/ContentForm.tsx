import React, { useEffect, useState } from "react";
import {
  Link,
  Type,
  Wifi,
  Mail,
  MessageSquare,
  Phone,
  Camera,
  Globe,
  Bitcoin,
  Calendar,
  User,
  Zap,
  Share2,
  X,
  FileText,
  Video,
  Music,
  Smartphone,
  ChevronDown,
  Loader2,
  Upload,
  Plus,
  ClipboardList,
  Building2,
  UtensilsCrossed,
  Ticket,
  Palette,
  Users,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  QrCode,
  AlignLeft,
  Hash,
  ToggleRight,
  CheckSquare,
  List,
  Trash2,
  GripVertical,
  Search,
} from "lucide-react";
import { QRType } from '@/services/qr-thrive/types';
type QRConfiguration = any;
type QRData = any;
const FormBuilder: React.FC<{
  fields: any[];
  onChange: (fields: any[]) => void;
}> = ({ fields = [], onChange }) => {
  const addField = (type: string) => {
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: "",
      required: false,
      options: type === "select" ? ["Option 1"] : undefined,
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: any) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const fieldTypes = [
    { type: "text", label: "Short Text", icon: AlignLeft },
    { type: "textarea", label: "Long Text", icon: AlignLeft },
    { type: "email", label: "Email", icon: Mail },
    { type: "phone", label: "Phone", icon: Smartphone },
    { type: "number", label: "Number", icon: Hash },
    { type: "date", label: "Date", icon: Clock },
    { type: "boolean", label: "Yes/No", icon: ToggleRight },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare },
    { type: "select", label: "Dropdown", icon: List },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {fieldTypes.map((ft) => (
          <button
            key={ft.type}
            onClick={() => addField(ft.type)}
            className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            <ft.icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 mb-1" />
            <span className="text-[9px] font-bold text-gray-500 group-hover:text-blue-700 uppercase tracking-tighter">
              {ft.label}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-300" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Field {index + 1}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[8px] font-black uppercase">
                  {field.type}
                </span>
              </div>
              <button
                onClick={() => removeField(field.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Field Label (e.g. Your Full Name)"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 px-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase">Required</span>
                <button
                  onClick={() => updateField(field.id, { required: !field.required })}
                  className={cn(
                    "w-8 h-4 rounded-full transition-all relative",
                    field.required ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                      field.required ? "right-0.5" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            </div>

            {field.type === "select" && (
              <div className="pt-2 space-y-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Options</p>
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center gap-1 bg-blue-50/50 border border-blue-100 p-1 rounded-lg">
                      <input
                        type="text"
                        className="bg-transparent border-none text-[10px] font-bold text-blue-800 w-20 focus:ring-0 p-0"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...field.options];
                          newOpts[optIdx] = e.target.value;
                          updateField(field.id, { options: newOpts });
                        }}
                      />
                      <button
                        onClick={() => {
                          const newOpts = field.options.filter((_: any, i: number) => i !== optIdx);
                          updateField(field.id, { options: newOpts });
                        }}
                        className="text-blue-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                    className="flex items-center gap-1 px-2 py-1 border border-dashed border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50"
                  >
                    <Plus className="w-3 h-3" /> Add Option
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
const countries = [
  { code: 'AF', dialCode: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', dialCode: '+355', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', dialCode: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AS', dialCode: '+1-684', name: 'American Samoa', flag: '🇦🇸' },
  { code: 'AD', dialCode: '+376', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', dialCode: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: 'AI', dialCode: '+1-264', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AQ', dialCode: '+672', name: 'Antarctica', flag: '🇦🇶' },
  { code: 'AG', dialCode: '+1-268', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', dialCode: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', dialCode: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AW', dialCode: '+297', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', dialCode: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', dialCode: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', dialCode: '+1-242', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', dialCode: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', dialCode: '+1-246', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', dialCode: '+375', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', dialCode: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', dialCode: '+501', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', dialCode: '+229', name: 'Benin', flag: '🇧🇯' },
  { code: 'BM', dialCode: '+1-441', name: 'Bermuda', flag: '🇧🇲' },
  { code: 'BT', dialCode: '+975', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', dialCode: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', dialCode: '+387', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', dialCode: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', dialCode: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IO', dialCode: '+246', name: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: 'VG', dialCode: '+1-284', name: 'British Virgin Islands', flag: '🇻🇬' },
  { code: 'BN', dialCode: '+673', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', dialCode: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', dialCode: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', dialCode: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', dialCode: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', dialCode: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', dialCode: '+238', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'KY', dialCode: '+1-345', name: 'Cayman Islands', flag: '🇰🇾' },
  { code: 'CF', dialCode: '+236', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', dialCode: '+235', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', dialCode: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', dialCode: '+86', name: 'China', flag: '🇨🇳' },
  { code: 'CX', dialCode: '+61', name: 'Christmas Island', flag: '🇨🇽' },
  { code: 'CC', dialCode: '+61', name: 'Cocos Islands', flag: '🇨🇨' },
  { code: 'CO', dialCode: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', dialCode: '+269', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CK', dialCode: '+682', name: 'Cook Islands', flag: '🇨🇰' },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'HR', dialCode: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', dialCode: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CW', dialCode: '+599', name: 'Curacao', flag: '🇨🇼' },
  { code: 'CY', dialCode: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'CD', dialCode: '+243', name: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: 'DK', dialCode: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', dialCode: '+253', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', dialCode: '+1-767', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', dialCode: '+1-809', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'TL', dialCode: '+670', name: 'East Timor', flag: '🇹🇱' },
  { code: 'EC', dialCode: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', dialCode: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', dialCode: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', dialCode: '+240', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', dialCode: '+291', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', dialCode: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: 'ET', dialCode: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FK', dialCode: '+500', name: 'Falkland Islands', flag: '🇫🇰' },
  { code: 'FO', dialCode: '+298', name: 'Faroe Islands', flag: '🇫🇴' },
  { code: 'FJ', dialCode: '+679', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', dialCode: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'PF', dialCode: '+689', name: 'French Polynesia', flag: '🇵🇫' },
  { code: 'GA', dialCode: '+241', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', dialCode: '+220', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', dialCode: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', dialCode: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GI', dialCode: '+350', name: 'Gibraltar', flag: '🇬🇮' },
  { code: 'GR', dialCode: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: 'GL', dialCode: '+299', name: 'Greenland', flag: '🇬🇱' },
  { code: 'GD', dialCode: '+1-473', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GU', dialCode: '+1-671', name: 'Guam', flag: '🇬🇺' },
  { code: 'GT', dialCode: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GG', dialCode: '+44-1481', name: 'Guernsey', flag: '🇬🇬' },
  { code: 'GN', dialCode: '+224', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', dialCode: '+245', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', dialCode: '+592', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', dialCode: '+509', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', dialCode: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', dialCode: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', dialCode: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', dialCode: '+354', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', dialCode: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', dialCode: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', dialCode: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IM', dialCode: '+44-1624', name: 'Isle of Man', flag: '🇮🇲' },
  { code: 'IL', dialCode: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', dialCode: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: 'CI', dialCode: '+225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'JM', dialCode: '+1-876', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', dialCode: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: 'JE', dialCode: '+44-1534', name: 'Jersey', flag: '🇯🇪' },
  { code: 'JO', dialCode: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', dialCode: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', dialCode: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', dialCode: '+686', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'XK', dialCode: '+383', name: 'Kosovo', flag: '🇽🇰' },
  { code: 'KW', dialCode: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', dialCode: '+996', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', dialCode: '+856', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', dialCode: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', dialCode: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', dialCode: '+266', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', dialCode: '+231', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', dialCode: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', dialCode: '+423', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', dialCode: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', dialCode: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', dialCode: '+853', name: 'Macau', flag: '🇲🇴' },
  { code: 'MK', dialCode: '+389', name: 'Macedonia', flag: '🇲🇰' },
  { code: 'MG', dialCode: '+261', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', dialCode: '+265', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', dialCode: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', dialCode: '+223', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', dialCode: '+356', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', dialCode: '+692', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', dialCode: '+222', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', dialCode: '+230', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'YT', dialCode: '+262', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'MX', dialCode: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', dialCode: '+691', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', dialCode: '+373', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', dialCode: '+377', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', dialCode: '+976', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', dialCode: '+382', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MS', dialCode: '+1-664', name: 'Montserrat', flag: '🇲🇸' },
  { code: 'MA', dialCode: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', dialCode: '+258', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', dialCode: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', dialCode: '+264', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', dialCode: '+674', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', dialCode: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NC', dialCode: '+687', name: 'New Caledonia', flag: '🇳🇨' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', dialCode: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', dialCode: '+227', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NU', dialCode: '+683', name: 'Niue', flag: '🇳🇺' },
  { code: 'KP', dialCode: '+850', name: 'North Korea', flag: '🇰🇵' },
  { code: 'MP', dialCode: '+1-670', name: 'Northern Mariana Islands', flag: '🇲🇵' },
  { code: 'NO', dialCode: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', dialCode: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', dialCode: '+680', name: 'Palau', flag: '🇵🇼' },
  { code: 'PS', dialCode: '+970', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', dialCode: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', dialCode: '+675', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', dialCode: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', dialCode: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', dialCode: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PN', dialCode: '+64', name: 'Pitcairn', flag: '🇵🇳' },
  { code: 'PL', dialCode: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', dialCode: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: 'PR', dialCode: '+1-787', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'QA', dialCode: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: 'CG', dialCode: '+242', name: 'Republic of the Congo', flag: '🇨🇬' },
  { code: 'RE', dialCode: '+262', name: 'Reunion', flag: '🇷🇪' },
  { code: 'RO', dialCode: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', dialCode: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', dialCode: '+250', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'BL', dialCode: '+590', name: 'Saint Barthelemy', flag: '🇧🇱' },
  { code: 'SH', dialCode: '+290', name: 'Saint Helena', flag: '🇸🇭' },
  { code: 'KN', dialCode: '+1-869', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', dialCode: '+1-758', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'MF', dialCode: '+590', name: 'Saint Martin', flag: '🇲🇫' },
  { code: 'PM', dialCode: '+508', name: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: 'VC', dialCode: '+1-784', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', dialCode: '+685', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', dialCode: '+378', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', dialCode: '+239', name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', dialCode: '+221', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', dialCode: '+381', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', dialCode: '+248', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', dialCode: '+232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', dialCode: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SX', dialCode: '+1-721', name: 'Sint Maarten', flag: '🇸🇽' },
  { code: 'SK', dialCode: '+421', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', dialCode: '+386', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', dialCode: '+677', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', dialCode: '+252', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', dialCode: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: 'SS', dialCode: '+211', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', dialCode: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', dialCode: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', dialCode: '+249', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', dialCode: '+597', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SJ', dialCode: '+47', name: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
  { code: 'SZ', dialCode: '+268', name: 'Swaziland', flag: '🇸🇿' },
  { code: 'SE', dialCode: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', dialCode: '+963', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', dialCode: '+886', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', dialCode: '+992', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', dialCode: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', dialCode: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TG', dialCode: '+228', name: 'Togo', flag: '🇹🇬' },
  { code: 'TK', dialCode: '+690', name: 'Tokelau', flag: '🇹🇰' },
  { code: 'TO', dialCode: '+676', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', dialCode: '+1-868', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', dialCode: '+216', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', dialCode: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', dialCode: '+993', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TC', dialCode: '+1-649', name: 'Turks and Caicos Islands', flag: '🇹🇨' },
  { code: 'TV', dialCode: '+688', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'VI', dialCode: '+1-340', name: 'U.S. Virgin Islands', flag: '🇻🇮' },
  { code: 'UG', dialCode: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', dialCode: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', dialCode: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', dialCode: '+998', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', dialCode: '+678', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', dialCode: '+379', name: 'Vatican', flag: '🇻🇦' },
  { code: 'VE', dialCode: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'WF', dialCode: '+681', name: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: 'EH', dialCode: '+212', name: 'Western Sahara', flag: '🇪🇭' },
  { code: 'YE', dialCode: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', dialCode: '+260', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', dialCode: '+263', name: 'Zimbabwe', flag: '🇿🇼' }
];

const CountrySelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedCountry = countries.find(c => c.dialCode === value) || countries.find(c => c.dialCode === "+1");
  
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.dialCode.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-11 pr-10 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span>{selectedCountry?.flag}</span>
          <span>{selectedCountry?.name} ({selectedCountry?.dialCode})</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
            <div className="p-3 border-b border-gray-50 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-blue-600 transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((c) => (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => {
                      onChange(c.dialCode);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors text-left",
                      value === c.dialCode && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-sm font-bold text-gray-700">{c.name}</span>
                    </div>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      {c.dialCode}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No countries found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
const ImageEditor = (props: any) => <div>ImageEditor</div>;

const useQRCodes = () => ({ data: [] }); const useCurrentUser = () => ({ data: { user: null } });

interface ContentPanelProps {
  config: QRConfiguration;
  updateData: (updates: Partial<QRData>) => void;
  hideTypeSelector?: boolean;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CollapsibleSection = ({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  isExpanded,
  onToggle,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}) => {
  return (
    <div
      className={cn(
        "border border-gray-100 rounded-[24px] overflow-hidden transition-all",
        isExpanded ? "shadow-sm" : "hover:bg-gray-50/50",
        className,
      )}
    >
      <button
        onClick={() => onToggle(id)}
        className="w-full p-4 bg-gray-50 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100/50 transition-colors text-left"
      >
        <Icon className="w-5 h-5 text-gray-500" />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-gray-400 transition-transform duration-300",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden border-t border-gray-100/50",
          isExpanded
            ? "max-h-[5000px] opacity-100"
            : "max-h-0 opacity-0 invisible",
        )}
      >
        <div className="p-6 bg-white space-y-6">{children}</div>
      </div>
    </div>
  );
};

const QRPickerDropdown = ({ currentData, updateData, typeKey }: any) => {
  const { data: qrCodes = [] } = useQRCodes();
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
        Connect to another QR Code
      </p>
      <select
        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm appearance-none cursor-pointer"
        value={currentData.qrLinkId || ""}
        onChange={(e) =>
          updateData({
            [typeKey]: { ...currentData, qrLinkId: e.target.value },
          })
        }
      >
        <option value="">Select a QR code...</option>
        {qrCodes.map((qr: any) => (
          <option key={qr.id} value={qr.id}>
            {qr.name || qr.type} {qr.shortId ? `(${qr.shortId})` : ""}
          </option>
        ))}
      </select>
      <p className="text-[9px] text-gray-400 font-medium">
        When the customer clicks the CTA, they will be directed to the linked QR
        experience.
      </p>
    </div>
  );
};

const QROptionsList = () => {
  const { data: qrCodes = [] } = useQRCodes();
  return (
    <>
      {qrCodes.map((qr: any) => (
        <option key={qr.id} value={qr.id}>
          {qr.name || qr.type} {qr.shortId ? `(${qr.shortId})` : ""}
        </option>
      ))}
    </>
  );
};

const CTADestinationPicker = ({
  data,
  updateData,
  typeKey, // e.g., 'pdf', 'mp3', 'video', 'imageGalleryInfo', 'booking', 'coupon'
  urlKey = "buttonUrl",
  buttonLabelKey = "buttonText",
  showLabelInput = true,
}: any) => {
  const currentData = data[typeKey] || {};
  const destinationMode = currentData.destinationMode || "url";
  const isDashboard = window.location.pathname.includes("/dashboard");

  return (
    <div className="space-y-6">
      {showLabelInput && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            Button Text
          </p>
          <input
            type="text"
            className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
            placeholder="e.g. Learn More"
            value={currentData[buttonLabelKey] || ""}
            onChange={(e) =>
              updateData({
                [typeKey]: { ...currentData, [buttonLabelKey]: e.target.value },
              })
            }
          />
        </div>
      )}

      {isDashboard ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              Destination Mode
            </p>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1.5 rounded-2xl">
              <button
                onClick={() =>
                  updateData({
                    [typeKey]: { ...currentData, destinationMode: "url" },
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all",
                  destinationMode === "url"
                    ? "bg-white shadow-lg shadow-blue-100/50 border border-blue-100 scale-[1.02]"
                    : "hover:bg-white/50 border border-transparent",
                )}
              >
                <span className="text-base">🔗</span>
                <span
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    destinationMode === "url"
                      ? "text-blue-600"
                      : "text-gray-400",
                  )}
                >
                  External URL
                </span>
              </button>
              <button
                onClick={() =>
                  updateData({
                    [typeKey]: { ...currentData, destinationMode: "qr_link" },
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all",
                  destinationMode === "qr_link"
                    ? "bg-white shadow-lg shadow-blue-100/50 border border-blue-100 scale-[1.02]"
                    : "hover:bg-white/50 border border-transparent",
                )}
              >
                <span className="text-base">⚡</span>
                <span
                  className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    destinationMode === "qr_link"
                      ? "text-blue-600"
                      : "text-gray-400",
                  )}
                >
                  Connect QR
                </span>
              </button>
            </div>
          </div>

          {destinationMode === "url" && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                Button Link URL
              </p>
              <input
                type="url"
                className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                placeholder="https://..."
                value={currentData[urlKey] || ""}
                onChange={(e) =>
                  updateData({
                    [typeKey]: { ...currentData, [urlKey]: e.target.value },
                  })
                }
              />
            </div>
          )}

          {destinationMode === "qr_link" && (
            <QRPickerDropdown
              currentData={currentData}
              updateData={updateData}
              typeKey={typeKey}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            Button Link URL
          </p>
          <input
            type="url"
            className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
            placeholder="https://..."
            value={currentData[urlKey] || ""}
            onChange={(e) =>
              updateData({
                [typeKey]: { ...currentData, [urlKey]: e.target.value },
              })
            }
          />
        </div>
      )}
    </div>
  );
};

const OpeningHoursManager = ({
  data,
  updateData,
}: {
  data: any;
  updateData: any;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const currentHours = data.business?.openingHours || {};
  const activeDays = Object.keys(currentHours).filter((d) => !!currentHours[d]);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleConfirm = () => {
    const newHours = { ...currentHours };
    selectedDays.forEach((day) => {
      if (!newHours[day]) {
        newHours[day] = { from: "09:00", to: "17:00", isClosed: false };
      }
    });
    updateData({
      business: { ...(data.business || {}), openingHours: newHours },
    });
    setIsAdding(false);
    setSelectedDays([]);
  };

  const ALL_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {ALL_DAYS.filter((d) => activeDays.includes(d)).map((day) => {
          const hours = currentHours[day];
          const hourObj =
            typeof hours === "object"
              ? hours
              : { from: "09:00", to: "17:00", isClosed: false };
          const isClosed = typeof hours === "object" ? hours.isClosed : false;
          return (
            <div key={day} className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newHours = { ...currentHours };
                  delete newHours[day];
                  updateData({
                    business: {
                      ...(data.business || {}),
                      openingHours: newHours,
                    },
                  });
                }}
                className="p-1 text-red-400 hover:bg-red-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-700 capitalize w-20">
                {day}
              </span>
              <button
                onClick={() => {
                  const newHours = { ...currentHours };
                  newHours[day] = { ...hourObj, isClosed: !isClosed };
                  updateData({
                    business: {
                      ...(data.business || {}),
                      openingHours: newHours,
                    },
                  });
                }}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                  isClosed
                    ? "bg-red-50 text-red-500 border-red-100"
                    : "bg-green-50 text-green-600 border-green-100",
                )}
              >
                {isClosed ? "Closed" : "Open"}
              </button>
              {!isClosed && (
                <>
                  <input
                    type="time"
                    className="px-2 py-1.5 border border-gray-100 rounded-lg text-xs font-bold"
                    value={hourObj.from || "09:00"}
                    onChange={(e) => {
                      const newHours = { ...currentHours };
                      newHours[day] = { ...hourObj, from: e.target.value };
                      updateData({
                        business: {
                          ...(data.business || {}),
                          openingHours: newHours,
                        },
                      });
                    }}
                  />
                  <span className="text-gray-400 text-xs">to</span>
                  <input
                    type="time"
                    className="px-2 py-1.5 border border-gray-100 rounded-lg text-xs font-bold"
                    value={hourObj.to || "17:00"}
                    onChange={(e) => {
                      const newHours = { ...currentHours };
                      newHours[day] = { ...hourObj, to: e.target.value };
                      updateData({
                        business: {
                          ...(data.business || {}),
                          openingHours: newHours,
                        },
                      });
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Operating Hours
        </button>
      ) : (
        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            Select Days
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setSelectedDays(
                  selectedDays.length === ALL_DAYS.length ? [] : [...ALL_DAYS],
                )
              }
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                selectedDays.length === ALL_DAYS.length
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200",
              )}
            >
              All
            </button>
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors",
                  selectedDays.includes(day)
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300",
                )}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setIsAdding(false);
                setSelectedDays([]);
              }}
              className="flex-1 py-2 bg-white text-gray-600 font-bold rounded-xl text-sm border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedDays.length === 0}
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 hover:bg-blue-700"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ContentForm: React.FC<any> = ({
  type,
  data: propsData,
  onChange,
  isLocked,
}) => {
  const config = { data: { type, ...propsData } };
  const updateData = (updates: any) => onChange({ ...propsData, ...updates });
  const hideTypeSelector = true;
  const data = config.data;
  const { data: userData } = useCurrentUser();
  const user = userData?.user;
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    "basic-info": true,
    "personal-identity": true,
    "business-details": true,
    "restaurant-details": true,
    design: true,
    "coupon-details": true,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileSelect = (file: File, type: "pdf" | "mp3" | "video") => {
    setUploading(type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const previewUrl = ev.target?.result as string;
      const updates: any = {};
      if (type === "video") {
        updates.video = { url: previewUrl, pendingFile: { file } };
      } else {
        updates[type] = {
          url: previewUrl,
          name: file.name,
          size: file.size,
          pendingFile: { file },
        };
      }
      updateData(updates);
      setUploading(null);
    };
    reader.onerror = () => {
      console.error(`Failed to read ${type} file`);
      setUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleImagesSelect = async (files: File[]) => {
    setUploading("image");
    try {
      const newImagesPromises = files.map((file) => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            resolve({
              url: ev.target?.result as string,
              name: file.name,
              size: file.size,
              pendingFile: { file },
            });
          };
          reader.readAsDataURL(file);
        });
      });

      const newImages = await Promise.all(newImagesPromises);
      const currentImages = data.images || [];
      updateData({ images: [...currentImages, ...newImages] } as any);
    } catch (err) {
      console.error("Failed to handle multiple images:", err);
    } finally {
      setUploading(null);
    }
  };

  // Automatic Country Detection
  useEffect(() => {
    if (
      data.type === "whatsapp" &&
      !data.whatsapp?.phoneNumber &&
      !data.whatsapp?.countryCode
    ) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((geoData) => {
          if (geoData.country_code) {
            const country = countries.find(
              (c) => c.code === geoData.country_code,
            );
            if (country) {
              updateData({
                whatsapp: {
                  ...(data.whatsapp || { message: "" }),
                  countryCode: country.dialCode,
                },
              });
            }
          }
        })
        .catch(() => {
          console.warn("Country detection failed");
        });
    }
  }, [data.type]);
  const types: {
    type: QRType;
    icon: React.ReactNode;
    label: string;
    category: string;
  }[] = [
    {
      type: "url",
      icon: <Link className="w-4 h-4" />,
      label: "Website Link",
      category: "Basic",
    },
    {
      type: "text",
      icon: <Type className="w-4 h-4" />,
      label: "Plain Text",
      category: "Basic",
    },
    {
      type: "vcard",
      icon: <User className="w-4 h-4" />,
      label: "Digital vCard",
      category: "Personal",
    },
    {
      type: "wifi",
      icon: <Wifi className="w-4 h-4" />,
      label: "WiFi Access",
      category: "Basic",
    },
    {
      type: "email",
      icon: <Mail className="w-4 h-4" />,
      label: "Email Draft",
      category: "Basic",
    },
    {
      type: "sms",
      icon: <MessageSquare className="w-4 h-4" />,
      label: "SMS Message",
      category: "Basic",
    },
    {
      type: "whatsapp",
      icon: <Phone className="w-4 h-4" />,
      label: "WhatsApp",
      category: "Social",
    },
    {
      type: "image",
      icon: <Camera className="w-4 h-4" />,
      label: "Images",
      category: "Dynamic",
    },
    {
      type: "links",
      icon: <Share2 className="w-4 h-4" />,
      label: "Multi Links",
      category: "Social",
    },
    {
      type: "socials",
      icon: <Users className="w-4 h-4" />,
      label: "Social Channels",
      category: "Social",
    },
    {
      type: "pdf",
      icon: <FileText className="w-4 h-4" />,
      label: "PDF Doc",
      category: "Dynamic",
    },
    {
      type: "video",
      icon: <Video className="w-4 h-4" />,
      label: "Video",
      category: "Dynamic",
    },
    {
      type: "mp3",
      icon: <Music className="w-4 h-4" />,
      label: "MP3 Audio",
      category: "Dynamic",
    },
    {
      type: "app",
      icon: <Smartphone className="w-4 h-4" />,
      label: "App Store",
      category: "Dynamic",
    },
    {
      type: "crypto",
      icon: <Bitcoin className="w-4 h-4" />,
      label: "Crypto Pay",
      category: "Specific",
    },
    {
      type: "event",
      icon: <Calendar className="w-4 h-4" />,
      label: "Event Info",
      category: "Dynamic",
    },
    {
      type: "form",
      icon: <ClipboardList className="w-4 h-4" />,
      label: "Custom Form",
      category: "Dynamic",
    },
    {
      type: "business",
      icon: <Building2 className="w-4 h-4" />,
      label: "Business Profile",
      category: "Dynamic",
    },
    {
      type: "menu",
      icon: <UtensilsCrossed className="w-4 h-4" />,
      label: "Restaurant Menu",
      category: "Dynamic",
    },
    {
      type: "coupon",
      icon: <Ticket className="w-4 h-4" />,
      label: "Coupon",
      category: "Dynamic",
    },
  ];

  return (
    <div className="space-y-6">
      {!hideTypeSelector && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {types.map((t) => (
            <button
              key={t.type}
              onClick={() => updateData({ type: t.type })}
              className={cn(
                "flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all hover:bg-blue-50 text-left group min-h-[56px]",
                data.type === t.type
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "border-gray-100 bg-white text-gray-500 hover:text-blue-600",
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 transition-colors p-1.5 rounded-lg",
                  data.type === t.type
                    ? "bg-white/20 text-white"
                    : "bg-gray-50 text-gray-400 group-hover:text-blue-600",
                )}
              >
                {t.icon}
              </div>
              <span className="text-[10px] font-extrabold leading-tight flex-1 whitespace-nowrap">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="bg-white rounded-[24px] p-1 border border-gray-100 shadow-sm">
          <div className="p-6 space-y-8">
            {/* QR Code Name Section - Applied to ALL types */}
            <CollapsibleSection
              id="qr-name-section"
              title="Name of the QR Code"
              subtitle="Give a name to your QR code."
              icon={QrCode}
              isExpanded={expandedSections["qr-name-section"] !== false}
              onToggle={toggleSection}
            >
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Name
                </p>
                <input
                  type="text"
                  value={data.name || ""}
                  onChange={(e) => updateData({ name: e.target.value })}
                  placeholder="e.g. My Website QR"
                  className="w-full px-5 py-4 bg-blue-50/30 border-2 border-blue-100/50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all placeholder:text-gray-300"
                />
              </div>
            </CollapsibleSection>

            {data.type === "url" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Website Address
                  </p>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      value={data.url || ""}
                      onChange={(e) => updateData({ url: e.target.value })}
                      placeholder="https://your-website.com"
                      className={cn(
                        "w-full pl-12 pr-4 py-4 border-2 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30",
                        !data.url
                          ? "border-amber-100/50"
                          : "border-gray-50 focus:border-blue-600",
                      )}
                    />
                  </div>
                </div>

                <CollapsibleSection
                  id="url-theme"
                  title="Mockup Appearance"
                  icon={Palette}
                  isExpanded={expandedSections["url-theme"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Header Background Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-12 h-12 rounded-xl border-2 border-gray-100 cursor-pointer overflow-hidden"
                          value={data.urlPreview?.themeColor || "#00C9E0"}
                          onChange={(e) =>
                            updateData({
                              urlPreview: {
                                ...(data.urlPreview || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-mono text-sm uppercase font-bold text-gray-600"
                          value={data.urlPreview?.themeColor || "#00C9E0"}
                          onChange={(e) =>
                            updateData({
                              urlPreview: {
                                ...(data.urlPreview || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "text" && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Plain Text Content
                </p>
                <textarea
                  value={data.text || ""}
                  onChange={(e) => updateData({ text: e.target.value })}
                  placeholder="Enter the text you want to encode..."
                  rows={4}
                  className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                />
              </div>
            )}

            {data.type === "vcard" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="vcard-personal"
                  title="Personal Information"
                  icon={User}
                  isExpanded={expandedSections["vcard-personal"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          First Name
                        </p>
                        <input
                          type="text"
                          value={data.vcard?.firstName || ""}
                          onChange={(e) =>
                            updateData({
                              vcard: {
                                ...(data.vcard || ({} as any)),
                                firstName: e.target.value,
                              },
                            })
                          }
                          placeholder="John"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Last Name
                        </p>
                        <input
                          type="text"
                          value={data.vcard?.lastName || ""}
                          onChange={(e) =>
                            updateData({
                              vcard: {
                                ...(data.vcard || ({} as any)),
                                lastName: e.target.value,
                              },
                            })
                          }
                          placeholder="Doe"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Job Title
                      </p>
                      <input
                        type="text"
                        value={data.vcard?.jobTitle || ""}
                        onChange={(e) =>
                          updateData({
                            vcard: {
                              ...(data.vcard || ({} as any)),
                              jobTitle: e.target.value,
                            },
                          })
                        }
                        placeholder="CEO / Founder"
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Company
                      </p>
                      <input
                        type="text"
                        value={data.vcard?.company || ""}
                        onChange={(e) =>
                          updateData({
                            vcard: {
                              ...(data.vcard || ({} as any)),
                              company: e.target.value,
                            },
                          })
                        }
                        placeholder="Acme Inc."
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="vcard-contact"
                  title="Contact Details"
                  icon={Phone}
                  isExpanded={expandedSections["vcard-contact"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Email Address
                      </p>
                      <input
                        type="email"
                        value={data.vcard?.email || ""}
                        onChange={(e) =>
                          updateData({
                            vcard: {
                              ...(data.vcard || ({} as any)),
                              email: e.target.value,
                            },
                          })
                        }
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Mobile Number
                        </p>
                        <input
                          type="tel"
                          value={data.vcard?.mobile || ""}
                          onChange={(e) =>
                            updateData({
                              vcard: {
                                ...(data.vcard || ({} as any)),
                                mobile: e.target.value,
                              },
                            })
                          }
                          placeholder="+1 234 567 890"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Work Phone
                        </p>
                        <input
                          type="tel"
                          value={data.vcard?.phone || ""}
                          onChange={(e) =>
                            updateData({
                              vcard: {
                                ...(data.vcard || ({} as any)),
                                phone: e.target.value,
                              },
                            })
                          }
                          placeholder="+1 234 567 891"
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Website URL
                      </p>
                      <input
                        type="url"
                        value={data.vcard?.website || ""}
                        onChange={(e) =>
                          updateData({
                            vcard: {
                              ...(data.vcard || ({} as any)),
                              website: e.target.value,
                            },
                          })
                        }
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Physical Address
                      </p>
                      <input
                        type="text"
                        value={data.vcard?.address || ""}
                        onChange={(e) =>
                          updateData({
                            vcard: {
                              ...(data.vcard || ({} as any)),
                              address: e.target.value,
                            },
                          })
                        }
                        placeholder="123 Main St, City, Country"
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all text-sm"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="vcard-branding"
                  title="Profile & Branding"
                  icon={Palette}
                  isExpanded={expandedSections["vcard-branding"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Avatar / Photo
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.vcard?.avatar ? (
                            <img
                              src={data.vcard.avatar}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Photo
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateData({
                                    vcard: {
                                      ...(data.vcard || {}),
                                      avatar: ev.target?.result as string,
                                      avatarPendingFile: { file },
                                    },
                                  } as any);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Banner Image
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.vcard?.banner ? (
                            <img
                              src={data.vcard.banner}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Banner
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateData({
                                    vcard: {
                                      ...(data.vcard || {}),
                                      banner: ev.target?.result as string,
                                      bannerPendingFile: { file },
                                    },
                                  } as any);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Theme Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.vcard?.themeColor || "#2563eb"}
                            onChange={(e) =>
                              updateData({
                                vcard: {
                                  ...(data.vcard || {}),
                                  themeColor: e.target.value,
                                },
                              } as any)
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                            value={data.vcard?.themeColor || "#2563eb"}
                            onChange={(e) =>
                              updateData({
                                vcard: {
                                  ...(data.vcard || {}),
                                  themeColor: e.target.value,
                                },
                              } as any)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Accent Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.vcard?.accentColor || "#111827"}
                            onChange={(e) =>
                              updateData({
                                vcard: {
                                  ...(data.vcard || {}),
                                  accentColor: e.target.value,
                                },
                              } as any)
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                            value={data.vcard?.accentColor || "#111827"}
                            onChange={(e) =>
                              updateData({
                                vcard: {
                                  ...(data.vcard || {}),
                                  accentColor: e.target.value,
                                },
                              } as any)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="vcard-socials"
                  title="Social Links"
                  icon={Share2}
                  isExpanded={expandedSections["vcard-socials"]}
                  onToggle={toggleSection}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "instagram" as const,
                        label: "Instagram",
                        placeholder: "instagram.com/user",
                      },
                      {
                        id: "facebook" as const,
                        label: "Facebook",
                        placeholder: "facebook.com/user",
                      },
                      {
                        id: "twitter" as const,
                        label: "Twitter / X",
                        placeholder: "twitter.com/user",
                      },
                      {
                        id: "linkedin" as const,
                        label: "LinkedIn",
                        placeholder: "linkedin.com/in/user",
                      },
                      {
                        id: "youtube" as const,
                        label: "YouTube",
                        placeholder: "youtube.com/@user",
                      },
                      {
                        id: "tiktok" as const,
                        label: "TikTok",
                        placeholder: "tiktok.com/@user",
                      },
                      {
                        id: "github" as const,
                        label: "GitHub",
                        placeholder: "github.com/user",
                      },
                      {
                        id: "whatsapp" as const,
                        label: "WhatsApp",
                        placeholder: "+1234567890",
                      },
                    ].map((s) => (
                      <div key={s.id} className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {s.label}
                        </p>
                        <input
                          type="text"
                          value={(data.vcard?.socials as any)?.[s.id] || ""}
                          onChange={(e) =>
                            updateData({
                              vcard: {
                                ...(data.vcard || {}),
                                socials: {
                                  ...(data.vcard?.socials || {}),
                                  [s.id]: e.target.value,
                                },
                              },
                            } as any)
                          }
                          placeholder={s.placeholder}
                          className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold transition-all bg-gray-50/30"
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Note / Bio
                  </p>
                  <textarea
                    value={data.vcard?.note || ""}
                    onChange={(e) =>
                      updateData({
                        vcard: {
                          ...(data.vcard || ({} as any)),
                          note: e.target.value,
                        },
                      })
                    }
                    placeholder="Tell people a bit about yourself..."
                    rows={3}
                    className="w-full p-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-sm font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === "wifi" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Network Name (SSID)
                  </p>
                  <input
                    type="text"
                    value={data.wifi?.ssid || ""}
                    onChange={(e) =>
                      updateData({
                        wifi: {
                          ...(data.wifi || { password: "", encryption: "WPA" }),
                          ssid: e.target.value,
                        },
                      })
                    }
                    placeholder="My Network"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Password
                    </p>
                    <input
                      type="password"
                      value={data.wifi?.password || ""}
                      onChange={(e) =>
                        updateData({
                          wifi: {
                            ...(data.wifi || { ssid: "", encryption: "WPA" }),
                            password: e.target.value,
                          },
                        })
                      }
                      placeholder="Network Password"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Encryption
                    </p>
                    <select
                      value={data.wifi?.encryption || "WPA"}
                      onChange={(e) =>
                        updateData({
                          wifi: {
                            ...(data.wifi || { ssid: "", password: "" }),
                            encryption: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all appearance-none cursor-pointer"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {data.type === "email" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Recipient Email
                  </p>
                  <input
                    type="email"
                    value={data.email?.address || ""}
                    onChange={(e) =>
                      updateData({
                        email: {
                          ...(data.email || { subject: "", body: "" }),
                          address: e.target.value,
                        },
                      })
                    }
                    placeholder="example@mail.com"
                    className={cn(
                      "w-full px-4 py-3 border-2 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all",
                      !data.email?.address
                        ? "border-amber-100/50"
                        : "border-gray-50 focus:border-blue-600",
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Subject Line
                  </p>
                  <input
                    type="text"
                    value={data.email?.subject || ""}
                    onChange={(e) =>
                      updateData({
                        email: {
                          ...(data.email || { address: "", body: "" }),
                          subject: e.target.value,
                        },
                      })
                    }
                    placeholder="Optional subject"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Message Body
                  </p>
                  <textarea
                    value={data.email?.body || ""}
                    onChange={(e) =>
                      updateData({
                        email: {
                          ...(data.email || { address: "", subject: "" }),
                          body: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter your email contents..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === "sms" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Mobile Number
                  </p>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      value={data.sms?.number || ""}
                      onChange={(e) =>
                        updateData({
                          sms: {
                            ...(data.sms || { message: "" }),
                            number: e.target.value,
                          },
                        })
                      }
                      placeholder="+1 234 567 890"
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Predefined Message
                  </p>
                  <textarea
                    value={data.sms?.message || ""}
                    onChange={(e) =>
                      updateData({
                        sms: {
                          ...(data.sms || { number: "" }),
                          message: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter the message text..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === "whatsapp" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Country Code
                    </p>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        <Globe className="w-4 h-4" />
                      </div>
                      <CountrySelector 
                        value={data.whatsapp?.countryCode || "+1"}
                        onChange={(val) => 
                          updateData({
                            whatsapp: {
                              ...(data.whatsapp || { message: "" }),
                              countryCode: val,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={data.whatsapp?.phoneNumber || ""}
                        onChange={(e) =>
                          updateData({
                            whatsapp: {
                              ...(data.whatsapp || { message: "" }),
                              phoneNumber: e.target.value,
                            },
                          })
                        }
                        placeholder="234 567 890"
                        className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Default Message
                  </p>
                  <textarea
                    value={data.whatsapp?.message || ""}
                    onChange={(e) =>
                      updateData({
                        whatsapp: {
                          ...(data.whatsapp || {
                            countryCode: "+1",
                            phoneNumber: "",
                          }),
                          message: e.target.value,
                        },
                      })
                    }
                    placeholder="Enter your auto-message..."
                    rows={4}
                    className="w-full p-6 border-2 border-gray-50 focus:border-blue-600 rounded-3xl outline-none text-gray-900 font-semibold bg-gray-50/30 transition-all"
                  />
                </div>
              </div>
            )}

            {data.type === "socials" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="social-info"
                  title="Profile Information"
                  icon={User}
                  isExpanded={expandedSections["social-info"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Display Name
                      </p>
                      <input
                        type="text"
                        value={data.socials?.name || ""}
                        onChange={(e) =>
                          updateData({
                            socials: {
                              ...(data.socials || {}),
                              name: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold transition-all bg-gray-50/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Short Bio
                      </p>
                      <textarea
                        value={data.socials?.bio || ""}
                        onChange={(e) =>
                          updateData({
                            socials: {
                              ...(data.socials || {}),
                              bio: e.target.value,
                            },
                          })
                        }
                        placeholder="Tell people about yourself..."
                        rows={3}
                        className="w-full p-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-sm font-semibold bg-gray-50/30 transition-all"
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="social-images"
                  title="Carousel Gallery"
                  icon={ImageIcon}
                  isExpanded={expandedSections["social-images"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {(data.socials?.images || []).map((img: any, idx: number) => (
                        <div
                          key={idx}
                          className="relative group rounded-2xl overflow-hidden aspect-square border-2 border-gray-50 bg-gray-100"
                        >
                          <img
                            src={img.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingImage(img.url)}
                              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                            >
                              <Palette className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const newImages = [
                                  ...(data.socials?.images || []),
                                ];
                                newImages.splice(idx, 1);
                                updateData({
                                  socials: {
                                    ...(data.socials || {}),
                                    images: newImages,
                                  },
                                });
                              }}
                              className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="space-y-2">
                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/30 transition-all group">
                          <Camera className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors mb-2" />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600">
                            Add Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              files.forEach((file) => {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const url = ev.target?.result as string;
                                  const newImages = [
                                    ...(data.socials?.images || []),
                                    {
                                      id: Math.random().toString(),
                                      url,
                                      pendingFile: { file },
                                    },
                                  ];
                                  updateData({
                                    socials: {
                                      ...(data.socials || {}),
                                      images: newImages,
                                    },
                                  });
                                };
                                reader.readAsDataURL(file);
                              });
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="social-channels"
                  title="Social Channels"
                  icon={Share2}
                  isExpanded={expandedSections["social-channels"]}
                  onToggle={toggleSection}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        id: "instagram" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="2"
                              y="2"
                              width="20"
                              height="20"
                              rx="5"
                              ry="5"
                            ></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                          </svg>
                        ),
                        color: "text-pink-600",
                        placeholder: "instagram.com/user",
                      },
                      {
                        id: "facebook" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        ),
                        color: "text-blue-600",
                        placeholder: "facebook.com/user",
                      },
                      {
                        id: "twitter" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        ),
                        color: "text-gray-900",
                        placeholder: "twitter.com/user",
                      },
                      {
                        id: "linkedin" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.729C24 .774 23.204 0 22.225 0z" />
                          </svg>
                        ),
                        color: "text-blue-700",
                        placeholder: "linkedin.com/in/user",
                      },
                      {
                        id: "youtube" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                        ),
                        color: "text-red-600",
                        placeholder: "youtube.com/@user",
                      },
                      {
                        id: "tiktok" as const,
                        icon: (props: any) => (
                          <svg
                            {...props}
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96s3.35-1.92 5.27-1.74c1.1.07 2.13.44 3.06 1.06V.02z" />
                          </svg>
                        ),
                        color: "text-black",
                        placeholder: "tiktok.com/@user",
                      },
                    ].map((social) => (
                      <div
                        key={social.id}
                        className="relative group flex items-center gap-3"
                      >
                        <div className="flex-1 relative">
                          <div
                            className={cn(
                              "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                              social.color,
                            )}
                          >
                            <social.icon className="w-full h-full" />
                          </div>
                          <input
                            type="text"
                            value={data.socials?.[social.id] || ""}
                            onChange={(e) =>
                              updateData({
                                socials: {
                                  ...(data.socials || {}),
                                  [social.id]: e.target.value,
                                },
                              })
                            }
                            placeholder={social.placeholder}
                            className="w-full pl-12 pr-10 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold transition-all bg-gray-50/30"
                          />
                          {data.socials?.[social.id] && (
                            <button
                              onClick={() => {
                                const newSocials = { ...(data.socials || {}) };
                                delete newSocials[social.id];
                                updateData({ socials: newSocials });
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-200 hover:bg-gray-300 text-gray-500 rounded-lg transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {[
              "instagram",
              "facebook",
              "linkedin",
              "twitter",
              "youtube",
              "tiktok",
            ].includes(data.type) && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {data.type} Profile
                </p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors font-bold">
                    @
                  </div>
                  <input
                    type="text"
                    value={data.social?.username || ""}
                    onChange={(e) =>
                      updateData({
                        social: {
                          platform: data.type as any,
                          username: e.target.value,
                        },
                      })
                    }
                    placeholder="username"
                    className="w-full pl-10 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                  />
                </div>
              </div>
            )}

            {data.type === "crypto" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Select Coin
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {["bitcoin", "ethereum", "litecoin"].map((coin) => (
                      <button
                        key={coin}
                        onClick={() =>
                          updateData({
                            crypto: {
                              ...(data.crypto || { address: "" }),
                              coin: coin as any,
                            },
                          })
                        }
                        className={cn(
                          "py-3 rounded-xl border-2 transition-all font-semibold text-xs capitalize",
                          data.crypto?.coin === coin
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-50 text-gray-500",
                        )}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Wallet Address
                  </p>
                  <input
                    type="text"
                    value={data.crypto?.address || ""}
                    onChange={(e) =>
                      updateData({
                        crypto: {
                          ...(data.crypto || { coin: "bitcoin" }),
                          address: e.target.value,
                        },
                      })
                    }
                    placeholder="Paste your wallet address here"
                    className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                  />
                </div>
              </div>
            )}

            {data.type === "event" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      What's the Event called?
                    </p>
                    <input
                      type="text"
                      value={data.event?.title || ""}
                      onChange={(e) =>
                        updateData({
                          event: {
                            ...(data.event || {
                              location: "",
                              startDate: "",
                              endDate: "",
                              description: "",
                            }),
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="Event Name"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Where is it happening?
                    </p>
                    <input
                      type="text"
                      value={data.event?.location || ""}
                      onChange={(e) =>
                        updateData({
                          event: {
                            ...(data.event || {
                              title: "",
                              startDate: "",
                              endDate: "",
                              description: "",
                            }),
                            location: e.target.value,
                          },
                        })
                      }
                      placeholder="City, Stadium, or Zoom Link"
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-gray-900 font-semibold transition-all bg-gray-50/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {data.type === "image" && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(data.images || []).map((img: any, idx: number) => (
                    <div
                      key={idx}
                      className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group border-2 border-white shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        src={img.url}
                        alt={`Gallery ${idx}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const newImages = [...(data.images || [])];
                            newImages.splice(idx, 1);
                            updateData({
                              images:
                                newImages.length > 0 ? newImages : undefined,
                            } as any);
                          }}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <label className="relative aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all group">
                    <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Add Image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          handleMultipleImagesSelect(files);
                        }
                      }}
                    />
                  </label>
                </div>

                {(!data.images || data.images.length === 0) && (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                      Upload at least one image to your gallery
                    </p>
                  </div>
                )}

                <CollapsibleSection
                  id="image-cta"
                  title="Call to Action (Optional)"
                  icon={Link}
                  isExpanded={expandedSections["image-cta"]}
                  onToggle={toggleSection}
                >
                  <CTADestinationPicker
                    data={data}
                    updateData={updateData}
                    typeKey="imageGalleryInfo"
                  />
                </CollapsibleSection>
              </div>
            )}

            {data.type === "video" && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                    Paste Video URL
                  </p>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={data.video?.url || ""}
                      onChange={(e) =>
                        updateData({ video: { url: e.target.value } })
                      }
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full pl-11 pr-4 py-4 border-2 border-gray-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all bg-gray-50/30"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold italic translate-x-2">
                    Supports YouTube, Vimeo, and direct links.
                  </p>

                  <div className="relative mt-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-100"></span>
                    </div>
                    <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                      <span className="bg-white px-4 text-gray-400">
                        or upload
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                    {uploading === "video" ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm font-bold">Uploading...</span>
                      </div>
                    ) : data.video?.pendingFile ? (
                      <div className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                              {data.video.pendingFile.file.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Ready to upload
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateData({ video: undefined })}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">
                            Upload Video File
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            MP4, MOV, WebM up to 50MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileSelect(file, "video");
                            }
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>

                <CollapsibleSection
                  id="video-cta"
                  title="Call to Action (Optional)"
                  icon={Link}
                  isExpanded={expandedSections["video-cta"]}
                  onToggle={toggleSection}
                >
                  <CTADestinationPicker
                    data={data}
                    updateData={updateData}
                    typeKey="video"
                  />
                </CollapsibleSection>
              </div>
            )}

            {data.type === "pdf" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-12 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                  {uploading === "pdf" ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-bold">Uploading...</span>
                    </div>
                  ) : data.pdf?.pendingFile ? (
                    <div className="w-full flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-gray-900 truncate max-w-[250px]">
                            {data.pdf.pendingFile.file.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateData({ pdf: undefined })}
                        className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 mb-2">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-black text-gray-900 leading-none">
                          Upload PDF File
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          Click to browse or drag and drop
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file, "pdf");
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <CollapsibleSection
                  id="pdf-cta"
                  title="Call to Action (Optional)"
                  icon={Link}
                  isExpanded={expandedSections["pdf-cta"]}
                  onToggle={toggleSection}
                >
                  <CTADestinationPicker
                    data={data}
                    updateData={updateData}
                    typeKey="pdf"
                  />
                </CollapsibleSection>
              </div>
            )}

            {data.type === "mp3" && (
              <div className="space-y-6">
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-10 flex flex-col items-center justify-center space-y-4 transition-all relative overflow-hidden group">
                  {uploading === "mp3" ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-sm font-bold">Uploading...</span>
                    </div>
                  ) : data.mp3?.pendingFile ? (
                    <div className="w-full flex items-center justify-between p-6 bg-white rounded-2xl shadow-sm border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Music className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-base font-bold text-gray-900 truncate max-w-[250px]">
                            {data.mp3.pendingFile.file.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateData({ mp3: undefined })}
                        className="p-3 hover:bg-red-50 text-red-500 rounded-2xl transition-all"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 mb-2">
                        <Music className="w-8 h-8" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-black text-gray-900 leading-none">
                          Upload MP3 File
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          Click to browse or drag and drop
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="audio/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(file, "mp3");
                          }
                        }}
                      />
                    </>
                  )}
                </div>

                <CollapsibleSection
                  id="mp3-info"
                  title="Audio Player Details"
                  subtitle="Track Information"
                  icon={Music}
                  isExpanded={expandedSections["basic-info"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Company / Show Name
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. TechTalk Weekly"
                        value={data.mp3?.companyName || ""}
                        onChange={(e) =>
                          updateData({
                            mp3: {
                              ...(data.mp3 || ({} as any)),
                              companyName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Track Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. The Future of Web"
                        value={data.mp3?.title || ""}
                        onChange={(e) =>
                          updateData({
                            mp3: {
                              ...(data.mp3 || ({} as any)),
                              title: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Describe your audio content..."
                        rows={3}
                        value={data.mp3?.description || ""}
                        onChange={(e) =>
                          updateData({
                            mp3: {
                              ...(data.mp3 || ({} as any)),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <CTADestinationPicker
                      data={data}
                      updateData={updateData}
                      typeKey="mp3"
                    />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="mp3-design"
                  title="Colors & Style"
                  icon={Palette}
                  isExpanded={expandedSections["design"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Background Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.mp3?.themeColor || "#3b82f6"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  themeColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm uppercase"
                            value={data.mp3?.themeColor || "#3b82f6"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  themeColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Text Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.mp3?.textColor || "#ffffff"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  textColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm uppercase"
                            value={data.mp3?.textColor || "#ffffff"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  textColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Button Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.mp3?.buttonColor || "rgba(0,0,0,0.1)"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  buttonColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm uppercase"
                            value={data.mp3?.buttonColor || "rgba(0,0,0,0.1)"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  buttonColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Button Text
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.mp3?.buttonTextColor || "#ffffff"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  buttonTextColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm uppercase"
                            value={data.mp3?.buttonTextColor || "#ffffff"}
                            onChange={(e) =>
                              updateData({
                                mp3: {
                                  ...(data.mp3 || ({} as any)),
                                  buttonTextColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "app" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      App Store URL (iOS)
                    </p>
                    <input
                      type="url"
                      value={data.app?.ios || ""}
                      onChange={(e) =>
                        updateData({
                          app: { ...(data.app || {}), ios: e.target.value },
                        })
                      }
                      placeholder="https://apps.apple.com/..."
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Google Play URL (Android)
                    </p>
                    <input
                      type="url"
                      value={data.app?.android || ""}
                      onChange={(e) =>
                        updateData({
                          app: { ...(data.app || {}), android: e.target.value },
                        })
                      }
                      placeholder="https://play.google.com/..."
                      className="w-full px-4 py-3 border-2 border-gray-50 focus:border-blue-600 rounded-xl outline-none text-sm font-semibold bg-gray-50/30 transition-all"
                    />
                  </div>
                </div>

                <CollapsibleSection
                  id="app-branding"
                  title="App Branding"
                  icon={Palette}
                  isExpanded={expandedSections["basic-info"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        App Icon
                      </p>
                      <label className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden group">
                        {data.app?.icon ? (
                          <img
                            src={data.app.icon}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Camera className="w-5 h-5 text-gray-300 group-hover:text-blue-400" />
                            <span className="text-[8px] font-black text-gray-400 uppercase mt-1">
                              Upload
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                updateData({
                                  app: {
                                    ...(data.app || {}),
                                    icon: ev.target?.result as string,
                                    iconPendingFile: { file },
                                  },
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        App Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Download our Official App"
                        value={data.app?.title || ""}
                        onChange={(e) =>
                          updateData({
                            app: { ...(data.app || {}), title: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Short Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Get the best experience by downloading..."
                        rows={3}
                        value={data.app?.description || ""}
                        onChange={(e) =>
                          updateData({
                            app: {
                              ...(data.app || {}),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}
            {data.type === "form" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">
                      Form Builder
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Design your questions
                    </h2>
                  </div>
                  <div className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-xl">
                    Live Interactive
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Form Title
                    </p>
                    <input
                      type="text"
                      value={data.form?.title || ""}
                      onChange={(e) =>
                        updateData({
                          form: {
                            ...(data.form || { fields: [], title: "" }),
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Feedback Form"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Description (Optional)
                    </p>
                    <textarea
                      value={data.form?.description || ""}
                      onChange={(e) =>
                        updateData({
                          form: {
                            ...(data.form || { fields: [], title: "" }),
                            description: e.target.value,
                          },
                        })
                      }
                      placeholder="Tell your audience what this form is about..."
                      rows={2}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 focus:border-blue-600 rounded-2xl outline-none text-gray-900 font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <FormBuilder
                    fields={data.form?.fields || []}
                    onChange={(fields: any) =>
                      updateData({
                        form: { ...(data.form || { title: "" }), fields },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {data.type === "business" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="business-details"
                  title="Company Information"
                  subtitle="Basic Details"
                  icon={Building2}
                  isExpanded={expandedSections["business-details"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Company Name
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Acme Inc."
                        value={data.business?.companyName || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              companyName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Headline
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="We build amazing things"
                        value={data.business?.headline || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              headline: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        About
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Tell people about your business..."
                        rows={3}
                        value={data.business?.about || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              about: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Logo
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.business?.logo ? (
                            <img
                              src={data.business.logo}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Logo
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    business: {
                                      ...(data.business || {}),
                                      logo: ev.target?.result as string,
                                      logoPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Banner
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.business?.banner ? (
                            <img
                              src={data.business.banner}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Banner
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    business: {
                                      ...(data.business || {}),
                                      banner: ev.target?.result as string,
                                      bannerPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="business-contact"
                  title="Contact Details"
                  icon={Phone}
                  isExpanded={expandedSections["business-contact"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Email
                        </p>
                        <input
                          type="email"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="hello@company.com"
                          value={data.business?.contact?.email || ""}
                          onChange={(e) =>
                            updateData({
                              business: {
                                ...(data.business || {}),
                                contact: {
                                  ...(data.business?.contact || {}),
                                  email: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Phone
                        </p>
                        <input
                          type="tel"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="+1 234 567 890"
                          value={data.business?.contact?.phone || ""}
                          onChange={(e) =>
                            updateData({
                              business: {
                                ...(data.business || {}),
                                contact: {
                                  ...(data.business?.contact || {}),
                                  phone: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Website
                      </p>
                      <input
                        type="url"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="https://company.com"
                        value={data.business?.contact?.website || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              contact: {
                                ...(data.business?.contact || {}),
                                website: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Address
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="123 Main Street, City"
                        value={data.business?.contact?.address || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              contact: {
                                ...(data.business?.contact || {}),
                                address: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="business-socials"
                  title="Social Media"
                  icon={Share2}
                  isExpanded={expandedSections["business-socials"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    {[
                      {
                        key: "facebook",
                        label: "Facebook",
                        placeholder: "facebook.com/company",
                      },
                      {
                        key: "instagram",
                        label: "Instagram",
                        placeholder: "instagram.com/company",
                      },
                      {
                        key: "twitter",
                        label: "Twitter / X",
                        placeholder: "x.com/company",
                      },
                      {
                        key: "linkedin",
                        label: "LinkedIn",
                        placeholder: "linkedin.com/company/name",
                      },
                      {
                        key: "youtube",
                        label: "YouTube",
                        placeholder: "youtube.com/@company",
                      },
                    ].map((s) => (
                      <div key={s.key} className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          {s.label}
                        </p>
                        <input
                          type="url"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder={s.placeholder}
                          value={(data.business?.socials as any)?.[s.key] || ""}
                          onChange={(e) =>
                            updateData({
                              business: {
                                ...(data.business || {}),
                                socials: {
                                  ...(data.business?.socials || {}),
                                  [s.key]: e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="business-hours"
                  title="Opening Hours"
                  icon={Clock}
                  isExpanded={expandedSections["business-hours"]}
                  onToggle={toggleSection}
                >
                  <OpeningHoursManager data={data} updateData={updateData} />
                </CollapsibleSection>

                <CollapsibleSection
                  id="business-design"
                  title="Colors & Branding"
                  icon={Palette}
                  isExpanded={expandedSections["business-design"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Theme Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.business?.themeColor || "#3b82f6"}
                            onChange={(e) =>
                              updateData({
                                business: {
                                  ...(data.business || {}),
                                  themeColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                            value={data.business?.themeColor || "#3b82f6"}
                            onChange={(e) =>
                              updateData({
                                business: {
                                  ...(data.business || {}),
                                  themeColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Accent Color
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                            value={data.business?.accentColor || "#10b981"}
                            onChange={(e) =>
                              updateData({
                                business: {
                                  ...(data.business || {}),
                                  accentColor: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                            value={data.business?.accentColor || "#10b981"}
                            onChange={(e) =>
                              updateData({
                                business: {
                                  ...(data.business || {}),
                                  accentColor: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="business-cta"
                  title="Call to Action"
                  icon={Zap}
                  isExpanded={expandedSections["business-cta"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Button Text
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Visit our Shop"
                        value={data.business?.buttonText || ""}
                        onChange={(e) =>
                          updateData({
                            business: {
                              ...(data.business || {}),
                              buttonText: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <CTADestinationPicker
                      data={data}
                      updateData={updateData}
                      typeKey="business"
                      urlKey="buttonUrl"
                      showLabelInput={false}
                    />
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "menu" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="menu-info"
                  title="Restaurant Details"
                  icon={UtensilsCrossed}
                  isExpanded={expandedSections["restaurant-details"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Restaurant Name
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. The Golden Fork"
                        value={data.menu?.restaurantName || ""}
                        onChange={(e) =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              restaurantName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Describe your restaurant..."
                        rows={2}
                        value={data.menu?.description || ""}
                        onChange={(e) =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Currency Symbol
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="$"
                        value={data.menu?.currency || ""}
                        onChange={(e) =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              currency: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Logo
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.menu?.logo ? (
                            <img
                              src={data.menu.logo}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Logo
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    menu: {
                                      ...(data.menu || {}),
                                      logo: ev.target?.result as string,
                                      logoPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Banner
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.menu?.banner ? (
                            <img
                              src={data.menu.banner}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Banner
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    menu: {
                                      ...(data.menu || {}),
                                      banner: ev.target?.result as string,
                                      bannerPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="menu-design"
                  title="Colors & Styles"
                  icon={Palette}
                  isExpanded={expandedSections["design"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Theme Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                          value={data.menu?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              menu: {
                                ...(data.menu || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                          value={data.menu?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              menu: {
                                ...(data.menu || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "#3b82f6",
                        "#ef4444",
                        "#f97316",
                        "#eab308",
                        "#22c55e",
                        "#06b6d4",
                        "#8b5cf6",
                        "#ec4899",
                        "#1e293b",
                      ].map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            updateData({
                              menu: { ...(data.menu || {}), themeColor: c },
                            })
                          }
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            data.menu?.themeColor === c
                              ? "border-gray-900 scale-110"
                              : "border-transparent",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="menu-items"
                  title="Menu Categories & Items"
                  icon={ClipboardList}
                  isExpanded={expandedSections["menu-items"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-6">
                    {(data.menu?.categories || []).map((cat: any, cIdx: number) => (
                      <div
                        key={cIdx}
                        className="border-2 border-gray-50 rounded-xl p-4 space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="flex-1 px-4 py-2 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 text-sm"
                            placeholder="Category Name (e.g. Starters)"
                            value={cat.name}
                            onChange={(e) => {
                              const newCategories = [
                                ...(data.menu?.categories || []),
                              ];
                              newCategories[cIdx] = {
                                ...newCategories[cIdx],
                                name: e.target.value,
                              };
                              updateData({
                                menu: {
                                  ...(data.menu || {}),
                                  categories: newCategories,
                                },
                              });
                            }}
                          />
                          <button
                            onClick={() => {
                              const newCategories = [
                                ...(data.menu?.categories || []),
                              ];
                              newCategories.splice(cIdx, 1);
                              updateData({
                                menu: {
                                  ...(data.menu || {}),
                                  categories: newCategories,
                                },
                              });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="pl-4 border-l-2 border-gray-50 space-y-3">
                          {cat.items.map((item: any, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="flex flex-col gap-2 bg-gray-50 p-3 rounded-xl relative"
                            >
                              <button
                                className="absolute top-2 right-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md"
                                onClick={() => {
                                  const newCategories = [
                                    ...(data.menu?.categories || []),
                                  ];
                                  newCategories[cIdx] = {
                                    ...newCategories[cIdx],
                                    items: newCategories[cIdx].items.filter(
                                      (_: any, i: number) => i !== iIdx,
                                    ),
                                  };
                                  updateData({
                                    menu: {
                                      ...(data.menu || {}),
                                      categories: newCategories,
                                    },
                                  });
                                }}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="flex gap-2 mr-6">
                                <label className="w-12 h-12 shrink-0 rounded-xl bg-white border border-gray-100 flex items-center justify-center cursor-pointer overflow-hidden group">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Camera className="w-4 h-4 text-gray-400" />
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                          const newCategories = [
                                            ...(data.menu?.categories || []),
                                          ];
                                          const newItems = [
                                            ...newCategories[cIdx].items,
                                          ];
                                          newItems[iIdx] = {
                                            ...newItems[iIdx],
                                            image: ev.target?.result as string,
                                            imagePendingFile: { file },
                                          } as any;
                                          newCategories[cIdx] = {
                                            ...newCategories[cIdx],
                                            items: newItems,
                                          };
                                          updateData({
                                            menu: {
                                              ...(data.menu || {}),
                                              categories: newCategories,
                                            },
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                <input
                                  type="text"
                                  placeholder="Item Name"
                                  className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newCategories = [
                                      ...(data.menu?.categories || []),
                                    ];
                                    const newItems = [
                                      ...newCategories[cIdx].items,
                                    ];
                                    newItems[iIdx] = {
                                      ...newItems[iIdx],
                                      name: e.target.value,
                                    };
                                    newCategories[cIdx] = {
                                      ...newCategories[cIdx],
                                      items: newItems,
                                    };
                                    updateData({
                                      menu: {
                                        ...(data.menu || {}),
                                        categories: newCategories,
                                      },
                                    });
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Price"
                                  className="w-20 px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500"
                                  value={
                                    item.price
                                      ? item.price.toLocaleString()
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(
                                      /,/g,
                                      "",
                                    );
                                    const value = parseFloat(rawValue) || 0;
                                    const newCategories = [
                                      ...(data.menu?.categories || []),
                                    ];
                                    const newItems = [
                                      ...newCategories[cIdx].items,
                                    ];
                                    newItems[iIdx] = {
                                      ...newItems[iIdx],
                                      price: value,
                                    };
                                    newCategories[cIdx] = {
                                      ...newCategories[cIdx],
                                      items: newItems,
                                    };
                                    updateData({
                                      menu: {
                                        ...(data.menu || {}),
                                        categories: newCategories,
                                      },
                                    });
                                  }}
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Description (Optional)"
                                className="w-full px-3 py-2 rounded-lg text-sm text-gray-600 bg-white outline-none border border-transparent focus:border-blue-500"
                                value={item.description || ""}
                                onChange={(e) => {
                                  const newCategories = [
                                    ...(data.menu?.categories || []),
                                  ];
                                  const newItems = [
                                    ...newCategories[cIdx].items,
                                  ];
                                  newItems[iIdx] = {
                                    ...newItems[iIdx],
                                    description: e.target.value,
                                  };
                                  newCategories[cIdx] = {
                                    ...newCategories[cIdx],
                                    items: newItems,
                                  };
                                  updateData({
                                    menu: {
                                      ...(data.menu || {}),
                                      categories: newCategories,
                                    },
                                  });
                                }}
                              />
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newCategories = [
                                ...(data.menu?.categories || []),
                              ];
                              newCategories[cIdx] = {
                                ...newCategories[cIdx],
                                items: [
                                  ...newCategories[cIdx].items,
                                  {
                                    id: Math.random().toString(),
                                    name: "",
                                    price: 0,
                                  },
                                ],
                              };
                              updateData({
                                menu: {
                                  ...(data.menu || {}),
                                  categories: newCategories,
                                },
                              });
                            }}
                            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline p-1"
                          >
                            <Plus className="w-3 h-3" /> Add Item
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newCategories = [
                          ...(data.menu?.categories || []),
                          { id: Math.random().toString(), name: "", items: [] },
                        ];
                        updateData({
                          menu: {
                            ...(data.menu || {}),
                            categories: newCategories,
                          },
                        });
                      }}
                      className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="menu-fields"
                  title="Checkout Form Fields"
                  icon={Type}
                  isExpanded={expandedSections["menu-fields"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                      Customize what info you collect from customers at
                      checkout.
                    </p>
                    {(data.menu?.customFields || []).map((field: any, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl"
                      >
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500"
                          placeholder="Field Label"
                          value={field.label}
                          onChange={(e) => {
                            const newFields = [
                              ...(data.menu?.customFields || []),
                            ];
                            newFields[fIdx] = {
                              ...newFields[fIdx],
                              label: e.target.value,
                            };
                            updateData({
                              menu: {
                                ...(data.menu || {}),
                                customFields: newFields,
                              },
                            });
                          }}
                        />
                        <select
                          className="px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-gray-100 cursor-pointer"
                          value={field.type}
                          onChange={(e) => {
                            const newFields = [
                              ...(data.menu?.customFields || []),
                            ];
                            newFields[fIdx] = {
                              ...newFields[fIdx],
                              type: e.target.value,
                            };
                            updateData({
                              menu: {
                                ...(data.menu || {}),
                                customFields: newFields,
                              },
                            });
                          }}
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="textarea">Textarea</option>
                        </select>
                        <button
                          onClick={() => {
                            const newFields = [
                              ...(data.menu?.customFields || []),
                            ];
                            newFields.splice(fIdx, 1);
                            updateData({
                              menu: {
                                ...(data.menu || {}),
                                customFields: newFields,
                              },
                            });
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newFields = [
                          ...(data.menu?.customFields || []),
                          {
                            id: Math.random().toString(),
                            label: "",
                            type: "text",
                          },
                        ];
                        updateData({
                          menu: {
                            ...(data.menu || {}),
                            customFields: newFields,
                          },
                        });
                      }}
                      className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline p-1"
                    >
                      <Plus className="w-3 h-3" /> Add Field
                    </button>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="menu-success"
                  title="Success Screen"
                  icon={CheckCircle}
                  isExpanded={expandedSections["menu-success"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Success Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Order Placed!"
                        value={data.menu?.successTitle || ""}
                        onChange={(e) =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              successTitle: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Success Message
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Thank you! Your order is on the way."
                        rows={2}
                        value={data.menu?.successMessage || ""}
                        onChange={(e) =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              successMessage: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="menu-whatsapp"
                  title="WhatsApp Lead"
                  icon={Phone}
                  isExpanded={expandedSections["menu-whatsapp"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Show WhatsApp button
                        </p>
                        <p className="text-xs text-gray-400">
                          Display a "Chat with us" button on the order success
                          screen
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateData({
                            menu: {
                              ...(data.menu || {}),
                              showWhatsappCta: !data.menu?.showWhatsappCta,
                            },
                          })
                        }
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${data.menu?.showWhatsappCta ? "bg-[#25D366]" : "bg-gray-200"}`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${data.menu?.showWhatsappCta ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>

                    {data.menu?.showWhatsappCta && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          WhatsApp Number (with country code)
                        </p>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#25D366]">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                            placeholder="+234 801 234 5678"
                            value={data.menu?.whatsappNumber || ""}
                            onChange={(e) =>
                              updateData({
                                menu: {
                                  ...(data.menu || {}),
                                  whatsappNumber: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                          Include country code (e.g. +234, +1, +44). This number
                          will be used for the WhatsApp CTA on the success
                          screen.
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "coupon" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="coupon-details"
                  title="Coupon Details"
                  icon={Ticket}
                  isExpanded={expandedSections["coupon-details"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Coupon Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. 50% Off First Purchase"
                        value={data.coupon?.title || ""}
                        onChange={(e) =>
                          updateData({
                            coupon: {
                              ...(data.coupon || {}),
                              title: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Describe the offer..."
                        rows={2}
                        value={data.coupon?.description || ""}
                        onChange={(e) =>
                          updateData({
                            coupon: {
                              ...(data.coupon || {}),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Discount
                        </p>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="e.g. 20% OFF"
                          value={data.coupon?.discount || ""}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                discount: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Promo Code
                        </p>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="e.g. SUMMER50"
                          value={data.coupon?.promoCode || ""}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                promoCode: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Valid Until
                        </p>
                        <input
                          type="date"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          value={data.coupon?.validUntil || ""}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                validUntil: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Company Name
                        </p>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="Business Name"
                          value={data.coupon?.companyName || ""}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                companyName: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Terms & Conditions
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Valid for in-store purchases only..."
                        rows={2}
                        value={data.coupon?.terms || ""}
                        onChange={(e) =>
                          updateData({
                            coupon: {
                              ...(data.coupon || {}),
                              terms: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <CTADestinationPicker
                      data={data}
                      updateData={updateData}
                      typeKey="coupon"
                      urlKey="website"
                      showLabelInput={false}
                    />
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="coupon-design"
                  title="Design & Branding"
                  icon={Palette}
                  isExpanded={expandedSections["coupon-design"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Theme Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                          value={data.coupon?.themeColor || "#8b5cf6"}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                          value={data.coupon?.themeColor || "#8b5cf6"}
                          onChange={(e) =>
                            updateData({
                              coupon: {
                                ...(data.coupon || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Banner Image
                      </p>
                      <label className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                        {data.coupon?.banner ? (
                          <img
                            src={data.coupon.banner}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                              Upload Banner
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) =>
                                updateData({
                                  coupon: {
                                    ...(data.coupon || {}),
                                    banner: ev.target?.result as string,
                                    bannerPendingFile: { file },
                                  },
                                });
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "booking" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="booking-details"
                  title="Booking Information"
                  icon={Calendar}
                  isExpanded={expandedSections["booking-details"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Business Name
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Luxe Wellness Spa"
                        value={data.booking?.businessName || ""}
                        onChange={(e) =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              businessName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Subject / Service Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Full Body Massage"
                        value={data.booking?.title || ""}
                        onChange={(e) =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              title: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Detail Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="Describe your service..."
                        rows={3}
                        value={data.booking?.description || ""}
                        onChange={(e) =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Location
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Downtown Center, NY"
                        value={data.booking?.location || ""}
                        onChange={(e) =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              location: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="booking-cta"
                  title="Booking Destination"
                  icon={Link}
                  isExpanded={expandedSections["booking-cta"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-6">
                    {/* Destination Mode Selector */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Destination Type
                      </p>
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl">
                        {(
                          [
                            { id: "url", label: "External URL", icon: "🔗" },
                            { id: "calendar", label: "Calendar", icon: "📅" },
                            { id: "qr_link", label: "Link to QR", icon: "⚡" },
                          ] as const
                        ).map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() =>
                              updateData({
                                booking: {
                                  ...(data.booking || {}),
                                  destinationMode: mode.id,
                                },
                              })
                            }
                            className={cn(
                              "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all",
                              (data.booking?.destinationMode || "url") ===
                                mode.id
                                ? "bg-white shadow-lg shadow-blue-100/50 border border-blue-100 scale-[1.02]"
                                : "hover:bg-white/50 border border-transparent",
                            )}
                          >
                            <span className="text-base">{mode.icon}</span>
                            <span
                              className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                (data.booking?.destinationMode || "url") ===
                                  mode.id
                                  ? "text-blue-600"
                                  : "text-gray-400",
                              )}
                            >
                              {mode.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* URL Mode */}
                    {(data.booking?.destinationMode || "url") === "url" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            Booking URL (Calendly, etc.)
                          </p>
                          <input
                            type="url"
                            className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                            placeholder="https://calendly.com/your-link"
                            value={data.booking?.bookingUrl || ""}
                            onChange={(e) =>
                              updateData({
                                booking: {
                                  ...(data.booking || {}),
                                  bookingUrl: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Calendar Mode */}
                    {data.booking?.destinationMode === "calendar" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2">
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            Native Calendar Enabled
                          </p>
                          <p className="text-[10px] font-medium text-blue-500 leading-relaxed">
                            Customers will see an interactive calendar in the
                            preview. When they select a date/time and click
                            book, their request will appear in your Lead
                            Capturing dashboard.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* QR Link Mode */}
                    {data.booking?.destinationMode === "qr_link" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                            Connect to another QR Code
                          </p>
                          <QRPickerDropdown
                            currentData={data.booking || {}}
                            updateData={updateData}
                            typeKey="booking"
                          />
                        </div>
                      </div>
                    )}

                    {/* Button Text (shown for all modes) */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Button Text
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="e.g. Schedule Now"
                        value={data.booking?.buttonText || ""}
                        onChange={(e) =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              buttonText: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="booking-form"
                  title="Lead Capture & Custom Form"
                  icon={ClipboardList}
                  isExpanded={expandedSections["booking-form"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-gray-900">
                          Enable Custom Form
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          Capture specific details from customers before they
                          book.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          updateData({
                            booking: {
                              ...(data.booking || {}),
                              customFormEnabled:
                                !data.booking?.customFormEnabled,
                            },
                          })
                        }
                        className={cn(
                          "relative w-12 h-6 rounded-full transition-all duration-300",
                          data.booking?.customFormEnabled
                            ? "bg-blue-600"
                            : "bg-gray-200",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                            data.booking?.customFormEnabled
                              ? "translate-x-6"
                              : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>

                    {data.booking?.customFormEnabled && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <FormBuilder
                          fields={(data.booking?.customFormFields || []) as any}
                          onChange={(fields: any) =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                customFormFields: fields,
                              },
                            })
                          }
                        />
                      </div>
                    )}

                    <div className="pt-6 border-t border-gray-50 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-900">
                              WhatsApp Support
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              Add a "Chat on WhatsApp" button to the success
                              screen.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                whatsappEnabled: !data.booking?.whatsappEnabled,
                              },
                            })
                          }
                          className={cn(
                            "relative w-12 h-6 rounded-full transition-all duration-300",
                            data.booking?.whatsappEnabled
                              ? "bg-emerald-600"
                              : "bg-gray-200",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
                              data.booking?.whatsappEnabled
                                ? "translate-x-6"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                      </div>

                      {data.booking?.whatsappEnabled && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none pl-1">
                            WhatsApp Number
                          </p>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Smartphone className="w-4 h-4 text-gray-300" />
                            </div>
                            <input
                              type="text"
                              className="w-full px-4 py-3 pl-11 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                              placeholder="e.g. +1234567890"
                              value={data.booking?.whatsappNumber || ""}
                              onChange={(e) =>
                                updateData({
                                  booking: {
                                    ...(data.booking || {}),
                                    whatsappNumber: e.target.value,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="booking-design"
                  title="Design & Media"
                  icon={Palette}
                  isExpanded={expandedSections["booking-design"]}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    {/* Profile Image Upload */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Business Profile Image
                      </p>
                      <div className="flex items-center gap-4">
                        <label className="w-16 h-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden group">
                          {data.booking?.profileImageUrl ? (
                            <img
                              src={data.booking.profileImageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-gray-300 group-hover:text-blue-500" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  updateData({
                                    booking: {
                                      ...(data.booking || {}),
                                      profileImageUrl: ev.target
                                        ?.result as string,
                                      profilePendingFile: { file },
                                    },
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-600">
                            Company Logo/Avatar
                          </p>
                          <p className="text-[9px] text-gray-400">
                            Recommended 400x400px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cover Image Upload */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Cover Image
                      </p>
                      <label className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden group">
                        {data.booking?.imageUrl ? (
                          <img
                            src={data.booking.imageUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 text-gray-300 group-hover:text-blue-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-2">
                              Upload Cover Image
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                updateData({
                                  booking: {
                                    ...(data.booking || {}),
                                    imageUrl: ev.target?.result as string,
                                    coverPendingFile: { file },
                                  },
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Price (Optional)
                        </p>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="e.g. $120"
                          value={data.booking?.price || ""}
                          onChange={(e) =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                price: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Duration (Optional)
                        </p>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                          placeholder="e.g. 60 Min"
                          value={data.booking?.duration || ""}
                          onChange={(e) =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                duration: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Branding Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                          value={data.booking?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm uppercase"
                          value={data.booking?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              booking: {
                                ...(data.booking || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            )}

            {data.type === "links" && (
              <div className="space-y-6">
                <CollapsibleSection
                  id="links-info"
                  title="Profile & Appearance"
                  icon={User}
                  isExpanded={expandedSections["links-info"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Page Title
                      </p>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="My Links"
                        value={data.linksInfo?.title || ""}
                        onChange={(e) =>
                          updateData({
                            linksInfo: {
                              ...(data.linksInfo || {}),
                              title: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Description
                      </p>
                      <textarea
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-medium text-gray-900 bg-gray-50/30 text-sm"
                        placeholder="A short bio or tagline..."
                        rows={2}
                        value={data.linksInfo?.description || ""}
                        onChange={(e) =>
                          updateData({
                            linksInfo: {
                              ...(data.linksInfo || {}),
                              description: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Avatar
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.linksInfo?.avatar ? (
                            <img
                              src={data.linksInfo.avatar}
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <>
                              <User className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Avatar
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    linksInfo: {
                                      ...(data.linksInfo || {}),
                                      avatar: ev.target?.result as string,
                                      avatarPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Banner
                        </p>
                        <label className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all overflow-hidden">
                          {data.linksInfo?.banner ? (
                            <img
                              src={data.linksInfo.banner}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">
                                Upload Banner
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) =>
                                  updateData({
                                    linksInfo: {
                                      ...(data.linksInfo || {}),
                                      banner: ev.target?.result as string,
                                      bannerPendingFile: { file },
                                    },
                                  });
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Theme Color
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="w-10 h-10 rounded-lg border-2 border-gray-100 cursor-pointer"
                          value={data.linksInfo?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              linksInfo: {
                                ...(data.linksInfo || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border-2 border-gray-50 rounded-lg outline-none font-mono text-sm"
                          value={data.linksInfo?.themeColor || "#3b82f6"}
                          onChange={(e) =>
                            updateData({
                              linksInfo: {
                                ...(data.linksInfo || {}),
                                themeColor: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  id="links-list"
                  title="Your Links"
                  icon={Link}
                  isExpanded={expandedSections["links-list"] !== false}
                  onToggle={toggleSection}
                >
                  <div className="space-y-4">
                    {(data.linksList || []).map((link: any, lIdx: number) => (
                      <div
                        key={lIdx}
                        className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl"
                      >
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            className="w-full px-3 py-2 rounded-lg text-sm font-bold bg-white outline-none border border-transparent focus:border-blue-500"
                            placeholder="Link Title"
                            value={link.title}
                            onChange={(e) => {
                              const newLinks = [...(data.linksList || [])];
                              newLinks[lIdx] = {
                                ...newLinks[lIdx],
                                title: e.target.value,
                              };
                              updateData({ linksList: newLinks });
                            }}
                          />
                          <input
                            type="url"
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-white outline-none border border-transparent focus:border-blue-500"
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...(data.linksList || [])];
                              newLinks[lIdx] = {
                                ...newLinks[lIdx],
                                url: e.target.value,
                              };
                              updateData({ linksList: newLinks });
                            }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newLinks = [...(data.linksList || [])];
                            newLinks.splice(lIdx, 1);
                            updateData({ linksList: newLinks });
                          }}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newLinks = [
                          ...(data.linksList || []),
                          { title: "", url: "" },
                        ];
                        updateData({ linksList: newLinks });
                      }}
                      className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Link
                    </button>
                  </div>
                </CollapsibleSection>
              </div>
            )}
          </div>
        </div>

        {/* Universal QR Connector - Hidden on redirect types */}
        {![
          "url",
          "instagram",
          "facebook",
          "whatsapp",
          "twitter",
          "youtube",
          "tiktok",
          "linkedin",
        ].includes(data.type) && (
          <div className="mt-8">
            <CollapsibleSection
              id="universal-connector"
              title="QR Connector (Chaining)"
              subtitle="Redirect users to another QR experience"
              icon={Link}
              isExpanded={expandedSections["universal-connector"]}
              onToggle={toggleSection}
            >
              <div className="space-y-4 animate-in fade-in duration-300">
                {!user ? (
                  <div className="bg-blue-50/50 rounded-2xl p-6 border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 mb-3">
                      <Zap className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">
                      Unlock QR Chaining
                    </h4>
                    <p className="text-[10px] text-gray-500 font-medium mb-4 leading-relaxed max-w-[250px]">
                      Sign in or register to chain multiple QR codes together.
                      Automatically redirect users after they interact with this
                      code.
                    </p>
                    <button
                      onClick={() => {
                        const authModalBtn = document.querySelector(
                          "[data-auth-trigger]",
                        ) as HTMLElement;
                        if (authModalBtn) authModalBtn.click();
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-all active:scale-95"
                    >
                      Sign in to connect
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                        Connect to another QR Code
                      </p>
                      <select
                        className="w-full px-4 py-3 border-2 border-gray-50 rounded-xl outline-none font-bold text-gray-900 bg-gray-50/30 text-sm appearance-none cursor-pointer"
                        value={data.linkedQRCodeId || ""}
                        onChange={(e) =>
                          updateData({ linkedQRCodeId: e.target.value })
                        }
                      >
                        <option value="">None (Don't connect)</option>
                        <QROptionsList />
                      </select>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                      When visitors complete the interaction for this QR code
                      (like submitting a form or clicking a CTA button), they
                      will be automatically redirected to the connected
                      experience you select here.
                    </p>
                  </>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        <div className="flex items-start gap-5 p-7 bg-blue-50 rounded-[32px] border border-blue-100/50">
          <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-100 shrink-0">
            <Zap className="w-5 h-5 fill-yellow-300 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-[0.2em] mb-1.5 opacity-60">
              Professional Tip
            </p>
            <p className="text-[13px] text-blue-900/80 font-bold leading-relaxed">
              {(config as any).isDynamic
                ? "This is a Dynamic QR Code. You can change its destination content at any time—even after printing—without changing the QR image itself."
                : "Static codes encode data directly. For long-term use, tracking, and the ability to edit content, we recommend using Dynamic Mode."}
            </p>
          </div>
        </div>
      </div>

      {editingImage && (
        <ImageEditor
          imageSrc={editingImage}
          onSave={(editedImage: any) => {
            updateData({ image: { url: editedImage } } as any);
            setEditingImage(null);
          }}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </div>
  );
};

export default ContentForm;
