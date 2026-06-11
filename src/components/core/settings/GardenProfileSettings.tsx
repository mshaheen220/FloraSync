import { FC } from 'react';
import { Card, Input } from '../../../styles/StyledElements';
import { GardenProfile } from '../../../App';
import { Icon } from '../../common/Icon';
import { ImageUploadInput } from '../../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface GardenProfileSettingsProps {
  gardenProfile: GardenProfile;
  onUpdateGarden: (name: string, imageUrl: string) => void;
}

export const GardenProfileSettings: FC<GardenProfileSettingsProps> = ({ gardenProfile, onUpdateGarden }) => {
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="relative">
          {gardenProfile.imageUrl ? (
            <img src={gardenProfile.imageUrl} alt="Garden" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-xl object-cover border-2 border-primary-500" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-3xl font-bold text-primary-700 dark:text-primary-400 border-2 border-primary-500">
              <Icon name="leaf" size={32} />
            </div>
          )}
          <label className="absolute bottom-[-8px] right-[-8px] bg-primary-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-primary-600 transition-colors shadow-md text-xs leading-none flex items-center justify-center">
            <Icon name="camera" size={14} />
            <ImageUploadInput onUpload={(base64) => onUpdateGarden(gardenProfile.name || 'My Garden', base64)} maxWidth={400} />
          </label>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Garden Name</label>
          <Input value={gardenProfile.name || ''} onChange={e => onUpdateGarden(e.target.value, gardenProfile.imageUrl || '')} className="!mb-0" />
        </div>
      </div>
    </Card>
  );
};