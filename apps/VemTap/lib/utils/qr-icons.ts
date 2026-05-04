import { 
    Link2, 
    FileText, 
    Mail, 
    MessageSquare, 
    Wifi, 
    ImageIcon, 
    Music, 
    Video, 
    ClipboardList, 
    Calendar, 
    ShoppingBag,
    Contact,
    Phone
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export const getQrIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'url':
        case 'link':
            return Link2;
        case 'text':
            return FileText;
        case 'whatsapp':
            return FaWhatsapp;
        case 'vcard':
            return Contact;
        case 'email':
            return Mail;
        case 'sms':
            return MessageSquare;
        case 'wifi':
            return Wifi;
        case 'pdf':
            return FileText;
        case 'image':
            return ImageIcon;
        case 'mp3':
        case 'audio':
            return Music;
        case 'video':
            return Video;
        case 'form':
            return ClipboardList;
        case 'booking':
            return Calendar;
        case 'menu':
            return ShoppingBag;
        case 'phone':
            return Phone;
        default:
            return Link2;
    }
};

export const getQrDescription = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'url': return 'Website Link';
        case 'pdf': return 'PDF Document';
        case 'image': return 'Image Gallery';
        case 'vcard': return 'Contact Card';
        case 'form': return 'Feedback Form';
        case 'booking': return 'Booking/Reservation';
        case 'whatsapp': return 'WhatsApp Chat';
        case 'wifi': return 'WiFi Access';
        case 'video': return 'Video Content';
        default: return type?.toUpperCase() || 'LINK';
    }
};
