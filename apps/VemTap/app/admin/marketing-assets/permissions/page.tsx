"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Shield, ShieldCheck, ShieldAlert, BarChart2, Ban, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMarketingSettings, useUpsertMarketingSetting } from '@/services/marketing-assets/hooks';

const MODULES = [
  'Templates', 'Categories', 'Mockups', 'AI Prompts',
  'Generated Assets', 'Downloads', 'Analytics', 'Audit Logs',
  'Permissions', 'System Settings',
] as const;

type Module = typeof MODULES[number];

interface RoleConfig {
  name: string;
  icon: typeof Shield;
  color: string;
  bg: string;
  defaultAccess: Module[];
  restricted: Module[];
}

const ROLES_CONFIG: RoleConfig[] = [
  {
    name: 'Super Admin',
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-50',
    defaultAccess: [...MODULES],
    restricted: [],
  },
  {
    name: 'Marketing Admin',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    defaultAccess: ['Templates', 'Categories', 'Mockups', 'AI Prompts', 'Generated Assets'],
    restricted: ['Permissions', 'System Settings'],
  },
  {
    name: 'Analytics Admin',
    icon: BarChart2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    defaultAccess: ['Analytics', 'Downloads', 'Generated Assets'],
    restricted: ['Templates', 'Mockups', 'Permissions', 'System Settings', 'Categories'],
  },
  {
    name: 'Support Admin',
    icon: Users,
    color: 'text-green-600',
    bg: 'bg-green-50',
    defaultAccess: ['Generated Assets', 'Downloads', 'Audit Logs'],
    restricted: ['Templates', 'Categories', 'Mockups', 'AI Prompts', 'Permissions', 'System Settings', 'Analytics'],
  },
];

export default function AdminPermissionsPage() {
  const { data: settings } = useMarketingSettings();
  const saveMutation = useUpsertMarketingSetting();

  const [roleAccess, setRoleAccess] = useState<Record<string, Module[]>>({});
  const [initialAccess, setInitialAccess] = useState<Record<string, Module[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settings && !loaded) {
      const access: Record<string, Module[]> = {};
      ROLES_CONFIG.forEach((role) => {
        const stored = settings.find((s) => s.key === `role_access_${role.name.toLowerCase().replace(/\s+/g, '_')}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored.value) as Module[];
            access[role.name] = parsed.filter((m) => MODULES.includes(m));
          } catch {
            access[role.name] = [...role.defaultAccess];
          }
        } else {
          access[role.name] = [...role.defaultAccess];
        }
      });
      setRoleAccess(access);
      setInitialAccess(JSON.parse(JSON.stringify(access)));
      setLoaded(true);
    }
  }, [settings, loaded]);

  const toggleModule = (roleName: string, module: Module) => {
    setRoleAccess((prev) => {
      const current = prev[roleName] || [];
      const updated = current.includes(module)
        ? current.filter((m) => m !== module)
        : [...current, module];
      return { ...prev, [roleName]: updated };
    });
  };

  const hasChanges = loaded && JSON.stringify(roleAccess) !== JSON.stringify(initialAccess);

  const handleSave = async () => {
    try {
      for (const [roleName, modules] of Object.entries(roleAccess)) {
        const key = `role_access_${roleName.toLowerCase().replace(/\s+/g, '_')}`;
        await saveMutation.mutateAsync({ key, value: JSON.stringify(modules), type: 'json', description: `Module access for ${roleName} role` });
      }
      setInitialAccess(JSON.parse(JSON.stringify(roleAccess)));
      toast.success('Role permissions saved successfully!');
    } catch {
      toast.error('Failed to save permissions');
    }
  };

  const handleReset = () => {
    setRoleAccess(JSON.parse(JSON.stringify(initialAccess)));
    toast.success('Reset to last saved state');
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-primary size-5" />
            Admin Role Permissions
          </h3>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button onClick={handleReset} variant="outline" className="rounded-xl text-xs font-bold h-9 border-gray-100 gap-1.5">
                <RotateCcw size={14} /> Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="rounded-xl text-xs font-bold h-9 bg-primary text-white gap-1.5"
            >
              <Save size={14} />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 font-semibold mb-6">
          PRD §60: Toggle module access per role. Changes are saved to the system settings API.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROLES_CONFIG.map((role) => {
            const Icon = role.icon;
            const currentAccess = roleAccess[role.name] || role.defaultAccess;
            return (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${role.bg} rounded-xl`}>
                    <Icon size={20} className={role.color} />
                  </div>
                  <h4 className="font-extrabold text-gray-900">{role.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MODULES.map((module) => {
                    const isAllowed = currentAccess.includes(module);
                    const isDisabled = !loaded;
                    return (
                      <button
                        key={module}
                        onClick={() => !isDisabled && toggleModule(role.name, module)}
                        disabled={isDisabled}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isAllowed
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`size-4 rounded flex items-center justify-center transition-all ${
                          isAllowed ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {isAllowed && <ShieldCheck size={10} className="text-white" />}
                        </div>
                        {module}
                      </button>
                    );
                  })}
                </div>

                {role.restricted.length > 0 && (
                  <div className="flex items-start gap-2 pt-1 border-t border-gray-50">
                    <Ban size={12} className="text-rose-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-rose-400 font-semibold">
                      Default restricted: {role.restricted.join(', ')}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            <strong className="text-slate-700">Note:</strong> Module access toggles define which sections each role can view.
            Actual CRUD permissions (create, edit, delete, publish) within each module are enforced server-side through the <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">RolesGuard</code>.
            The saved configuration is stored as key-value settings under <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded font-mono">role_access_*</code> keys.
          </p>
        </div>
      </div>
    </div>
  );
}