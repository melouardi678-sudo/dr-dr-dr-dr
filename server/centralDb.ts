import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CentralDatabaseSchema {
  version: string;
  lastUpdated: string;
  settings: any;
  users: any[];
  patients: any[];
  appointments: any[];
  consultations: any[];
  prescriptions: any[];
  ultrasoundReports: any[];
  medications: any[];
  certificates: any[];
  analysisRequests: any[];
  invoices: any[];
  expenses: any[];
  stock: any[];
  auditLogs: any[];
}

export class CentralDatabase {
  private dataDir: string;
  private dbFilePath: string;
  private backupDir: string;
  private inMemoryDb: CentralDatabaseSchema | null = null;
  private isWriting = false;

  constructor() {
    // Determine data directory (Safe for macOS and Windows App Sandbox)
    let baseDir = process.env.MEDICAB_DATA_DIR;
    if (!baseDir) {
      if (process.env.NODE_ENV === 'production' && !process.env.MEDICAB_DEV_DATA) {
        const homeDir = os.homedir();
        if (process.platform === 'darwin') {
          baseDir = path.join(homeDir, 'Library', 'Application Support', 'MediCab', 'data');
        } else if (process.platform === 'win32') {
          const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
          baseDir = path.join(appData, 'MediCab', 'data');
        } else {
          baseDir = path.join(homeDir, '.medicab', 'data');
        }
      } else {
        baseDir = path.join(process.cwd(), 'data');
      }
    }
    this.dataDir = baseDir;
    this.backupDir = path.join(baseDir, 'backups');
    this.dbFilePath = path.join(baseDir, 'medicab_central_database.json');

    this.ensureDirectories();
    this.loadDatabase();
  }

  private ensureDirectories() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (err) {
      console.error('[CentralDB] Error creating directories:', err);
    }
  }

  private getDefaultData(): CentralDatabaseSchema {
    return {
      version: '2.4.0',
      lastUpdated: new Date().toISOString(),
      settings: {
        name: 'Cabinet Médical Dr. BENALI',
        doctorName: 'Dr. Karim BENALI',
        speciality: 'Médecine Générale & Chronique',
        address: '12 Avenue Mohammed V, Résidence Ibn Sina, 2ème étage',
        phone: '05 22 34 56 78 / 06 61 12 34 56',
        email: 'contact@cabinet-benali.ma',
        taxRate: 0,
        currency: 'DH',
        doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        language: 'fr',
        direction: 'ltr',
        theme: 'light',
        autoBackup: true,
      },
      users: [
        {
          id: 'usr_1',
          username: 'admin',
          fullName: 'Dr. Karim BENALI',
          role: 'admin',
          email: 'admin@medicab.ma',
          phone: '06 61 12 34 56',
          pinCode: '1234',
          status: 'active',
          passwordHash: '',
          passwordSalt: 'salt123',
        },
        {
          id: 'usr_2',
          username: 'secretaire',
          fullName: 'Siham EL AMRI',
          role: 'secretary',
          email: 'secretaire@medicab.ma',
          phone: '06 61 98 76 54',
          pinCode: '5678',
          status: 'active',
          passwordHash: '',
          passwordSalt: 'salt456',
        },
      ],
      patients: [],
      appointments: [],
      consultations: [],
      prescriptions: [],
      ultrasoundReports: [],
      medications: [],
      certificates: [],
      analysisRequests: [],
      invoices: [],
      expenses: [],
      stock: [],
      auditLogs: [
        {
          id: `log_init_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'usr_1',
          userName: 'Dr. Karim BENALI',
          role: 'admin',
          action: 'INIT_CENTRAL_DB',
          details: 'Base de données centrale initialisée sur le serveur principal',
          ipOrDevice: 'Serveur-Local-LAN',
        },
      ],
    };
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays and fields exist
        const defaults = this.getDefaultData();
        this.inMemoryDb = {
          ...defaults,
          ...parsed,
          settings: { ...defaults.settings, ...(parsed.settings || {}) },
          users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : defaults.users,
          patients: Array.isArray(parsed.patients) ? parsed.patients : [],
          appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
          consultations: Array.isArray(parsed.consultations) ? parsed.consultations : [],
          prescriptions: Array.isArray(parsed.prescriptions) ? parsed.prescriptions : [],
          ultrasoundReports: Array.isArray(parsed.ultrasoundReports) ? parsed.ultrasoundReports : [],
          medications: Array.isArray(parsed.medications) ? parsed.medications : [],
          certificates: Array.isArray(parsed.certificates) ? parsed.certificates : [],
          analysisRequests: Array.isArray(parsed.analysisRequests) ? parsed.analysisRequests : [],
          invoices: Array.isArray(parsed.invoices) ? parsed.invoices : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          stock: Array.isArray(parsed.stock) ? parsed.stock : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : defaults.auditLogs,
        };
        console.log(`[CentralDB] Loaded existing central database (${this.inMemoryDb.patients.length} patients, ${this.inMemoryDb.appointments.length} appointments).`);
      } else {
        console.log('[CentralDB] No existing central database file found. Initializing with default cabinet schema.');
        this.inMemoryDb = this.getDefaultData();
        this.persistSync();
      }
    } catch (err) {
      console.error('[CentralDB] Error loading database file:', err);
      this.inMemoryDb = this.getDefaultData();
    }
  }

  /**
   * Atomic file persist to prevent corruption
   */
  public persistSync(): void {
    if (!this.inMemoryDb || this.isWriting) return;
    this.isWriting = true;
    try {
      this.inMemoryDb.lastUpdated = new Date().toISOString();
      const content = JSON.stringify(this.inMemoryDb, null, 2);
      const tempPath = `${this.dbFilePath}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, content, 'utf8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      console.error('[CentralDB] Failed to persist database:', err);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Create an automated backup file on disk
   */
  public createBackup(label: string = 'auto'): string | null {
    try {
      if (!this.inMemoryDb) return null;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `medicab_backup_${label}_${timestamp}.json`;
      const backupFilePath = path.join(this.backupDir, backupFilename);
      fs.writeFileSync(backupFilePath, JSON.stringify(this.inMemoryDb, null, 2), 'utf8');
      console.log(`[CentralDB] Backup created successfully: ${backupFilename}`);
      return backupFilePath;
    } catch (err) {
      console.error('[CentralDB] Failed to create backup:', err);
      return null;
    }
  }

  public getFullData(): CentralDatabaseSchema {
    if (!this.inMemoryDb) {
      this.loadDatabase();
    }
    return JSON.parse(JSON.stringify(this.inMemoryDb));
  }

  public getCollection<T = any>(name: keyof CentralDatabaseSchema): T {
    if (!this.inMemoryDb) {
      this.loadDatabase();
    }
    return (this.inMemoryDb as any)[name];
  }

  public setCollection(name: keyof CentralDatabaseSchema, data: any): void {
    if (!this.inMemoryDb) {
      this.loadDatabase();
    }
    (this.inMemoryDb as any)[name] = data;
    this.persistSync();
  }

  public addAuditLog(action: string, details: string, user: { id: string; fullName: string; role: string }, ip: string = 'LAN'): void {
    if (!this.inMemoryDb) return;
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user.id || 'unknown',
      userName: user.fullName || 'Utilisateur',
      role: user.role || 'user',
      action,
      details,
      ipOrDevice: ip,
    };
    this.inMemoryDb.auditLogs = [newLog, ...this.inMemoryDb.auditLogs].slice(0, 1000);
    this.persistSync();
  }

  /**
   * Import data from Client/Local installation into Server Central DB
   * (Safe migration without losing data)
   */
  public importFromMigration(incomingData: Partial<CentralDatabaseSchema>): { success: boolean; stats: Record<string, number> } {
    this.createBackup('pre_migration');
    const db = this.inMemoryDb || this.getDefaultData();
    const stats: Record<string, number> = {};

    const collections: (keyof CentralDatabaseSchema)[] = [
      'patients',
      'appointments',
      'consultations',
      'prescriptions',
      'ultrasoundReports',
      'medications',
      'certificates',
      'analysisRequests',
      'invoices',
      'expenses',
      'stock',
    ];

    for (const key of collections) {
      const incomingList = (incomingData as any)[key];
      if (Array.isArray(incomingList) && incomingList.length > 0) {
        const currentList = Array.isArray((db as any)[key]) ? (db as any)[key] : [];
        const existingIds = new Set(currentList.map((item: any) => item.id));

        let addedCount = 0;
        for (const item of incomingList) {
          if (item && item.id && !existingIds.has(item.id)) {
            currentList.push(item);
            existingIds.add(item.id);
            addedCount++;
          }
        }
        (db as any)[key] = currentList;
        stats[key] = addedCount;
      }
    }

    if (incomingData.settings) {
      db.settings = { ...db.settings, ...incomingData.settings };
    }

    if (Array.isArray(incomingData.users)) {
      const existingUsernames = new Set(db.users.map((u: any) => u.username));
      for (const u of incomingData.users) {
        if (u && u.username && !existingUsernames.has(u.username)) {
          db.users.push(u);
        }
      }
    }

    this.inMemoryDb = db;
    this.persistSync();
    return { success: true, stats };
  }
}

export const centralDb = new CentralDatabase();
