import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import os from "os";
import net from "net";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { centralDb } from "./server/centralDb";
import { getLocalIpAddresses, getPrimaryLocalIp } from "./server/networkUtils";
import { wsSyncServer } from "./server/wsServer";

const envPath = process.env.NODE_ENV === "production" && (process as any).resourcesPath 
  ? path.join((process as any).resourcesPath, '.env') 
  : path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

// دالة آمنة تضمن البحث عن أول منفذ متاح قبل إنشاء السيرفر
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const testServer = net.createServer();
    testServer.listen(startPort, "0.0.0.0", () => {
      testServer.close(() => resolve(startPort));
    });
    testServer.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

let isServerStarting = false;

export async function startServer() {
  if (isServerStarting) return;
  isServerStarting = true;

  const app = express();
  const initialPort = Number(process.env.PORT) || 3000;
  const activePort = await findAvailablePort(initialPort);

  // LAN CORS Configuration
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-Role, X-User-Id, X-User-Name");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const getCallerUser = (req: express.Request) => {
    const role = (req.headers['x-user-role'] as string) || 'anonymous';
    const id = (req.headers['x-user-id'] as string) || 'anon';
    const fullName = (req.headers['x-user-name'] as string) || 'Utilisateur LAN';
    const ip = req.socket.remoteAddress || '127.0.0.1';
    return { id, fullName, role, ip };
  };

  // ==========================================
  // 1. HEALTH & NETWORK DIAGNOSTICS ENDPOINTS
  // ==========================================

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      server: "MediCab Central Server",
      version: "2.4.0",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/network/ping", (_req, res) => {
    res.json({
      success: true,
      message: "Serveur central MediCab accessible et opérationnel",
      serverTime: new Date().toISOString(),
      cabinetName: centralDb.getCollection("settings")?.name || "Cabinet Médical",
      activeClients: wsSyncServer.getConnectedClients().length,
    });
  });

  app.get("/api/network/info", (_req, res) => {
    const ips = getLocalIpAddresses();
    const primaryIp = getPrimaryLocalIp();
    const primaryIface = ips.find((i) => i.address === primaryIp) || ips[0];
    const hostname = os.hostname();
    const cleanHostname = hostname.replace(/\.local$/i, '');
    const bonjourHostname = `${cleanHostname}.local`;
    const platform = os.platform();
    const isMac = platform === "darwin";

    res.json({
      primaryIp,
      primaryMac: primaryIface?.mac || "00:00:00:00:00:00",
      interfaceName: primaryIface?.name || "Ethernet / Wi-Fi",
      netmask: primaryIface?.netmask || "255.255.255.0",
      hostname,
      bonjourHostname,
      bonjourUrl: `http://${bonjourHostname}:${activePort}`,
      platform,
      isMac,
      port: activePort,
      interfaces: ips,
      connectedClients: wsSyncServer.getConnectedClients().length,
      serverStatus: "ACTIVE",
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & PIN ENDPOINTS
  // ==========================================

  app.post("/api/auth/pin-login", (req, res) => {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: "Code PIN requis" });

    const users = centralDb.getCollection<any[]>("users") || [];
    const cleanPin = String(pin).trim();
    const user = users.find((u) => u.pinCode === cleanPin && u.status !== 'suspended');

    if (!user) return res.status(401).json({ error: "Code PIN incorrect ou compte désactivé" });

    user.lastLogin = new Date().toISOString();
    centralDb.persistSync();
    centralDb.addAuditLog("PIN_LOGIN", `Connexion réussie par PIN pour ${user.fullName} (${user.role})`, user, req.socket.remoteAddress || 'LAN');

    const token = `mct_${user.id}_${Date.now()}`;
    const { passwordHash, passwordSalt, ...safeUser } = user;

    res.json({ success: true, token, user: safeUser });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });

    const users = centralDb.getCollection<any[]>("users") || [];
    const cleanEmail = String(email).trim().toLowerCase();
    const user = users.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail && u.status !== 'suspended');

    if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });

    user.lastLogin = new Date().toISOString();
    centralDb.persistSync();
    centralDb.addAuditLog("LOGIN", `Connexion réussie pour ${user.fullName} (${user.role})`, user, req.socket.remoteAddress || 'LAN');

    const token = `mct_${user.id}_${Date.now()}`;
    const { passwordHash, passwordSalt, ...safeUser } = user;

    res.json({ success: true, token, user: safeUser });
  });

  // ==========================================
  // 3. CENTRAL DATA CRUD WITH PERMISSIONS
  // ==========================================

  app.get("/api/data/:collection", (req, res) => {
    const collectionName = req.params.collection as any;
    try {
      const data = centralDb.getCollection(collectionName);
      if (data === undefined) return res.status(404).json({ error: `Collection '${collectionName}' introuvable` });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/data/batch/:collection", (req, res) => {
    const collectionName = req.params.collection as any;
    const caller = getCallerUser(req);
    const { items } = req.body;

    if (caller.role === 'secretary') {
      if (['users', 'accounting', 'securityLogs'].includes(collectionName)) {
        return res.status(403).json({ error: "Accès refusé : Action réservée au médecin administrateur." });
      }
    }

    try {
      centralDb.setCollection(collectionName, items);
      centralDb.addAuditLog(`BATCH_UPDATE_${collectionName.toUpperCase()}`, `Mise à jour par lot de ${collectionName} (${Array.isArray(items) ? items.length : 1} éléments)`, caller, caller.ip);
      wsSyncServer.broadcast({ type: 'sync:mutation', entity: collectionName, action: 'refresh', data: items, sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
      res.json({ success: true, count: Array.isArray(items) ? items.length : 1 });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/data/:collection", (req, res) => {
    const collectionName = req.params.collection as any;
    const caller = getCallerUser(req);
    const item = req.body;

    if (caller.role === 'secretary' && ['users', 'accounting'].includes(collectionName)) {
      return res.status(403).json({ error: "Accès refusé : Action réservée au médecin." });
    }

    try {
      const current = centralDb.getCollection<any[]>(collectionName);
      if (Array.isArray(current)) {
        const newItem = {
          ...item,
          id: item.id || `${collectionName.substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updated = [newItem, ...current];
        centralDb.setCollection(collectionName, updated);
        centralDb.addAuditLog(`CREATE_${collectionName.toUpperCase()}`, `Création dans ${collectionName}: ${newItem.fullName || newItem.name || newItem.id}`, caller, caller.ip);
        wsSyncServer.broadcast({ type: 'sync:mutation', entity: collectionName, action: 'create', data: newItem, sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
        return res.json({ success: true, item: newItem });
      } else {
        centralDb.setCollection(collectionName, item);
        wsSyncServer.broadcast({ type: 'sync:mutation', entity: collectionName, action: 'update', data: item, sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
        return res.json({ success: true, item });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/data/:collection/:id", (req, res) => {
    const collectionName = req.params.collection as any;
    const id = req.params.id;
    const caller = getCallerUser(req);
    const updatePayload = req.body;

    if (caller.role === 'secretary' && ['users', 'accounting'].includes(collectionName)) {
      return res.status(403).json({ error: "Accès refusé : Action réservée au médecin." });
    }

    try {
      const current = centralDb.getCollection<any[]>(collectionName);
      if (Array.isArray(current)) {
        const index = current.findIndex((it) => it.id === id);
        if (index === -1) return res.status(404).json({ error: `Élément avec l'ID ${id} introuvable dans ${collectionName}` });

        const existing = current[index];
        const updatedItem = { ...existing, ...updatePayload, id, updatedAt: new Date().toISOString() };
        current[index] = updatedItem;
        centralDb.setCollection(collectionName, current);
        centralDb.addAuditLog(`UPDATE_${collectionName.toUpperCase()}`, `Modification dans ${collectionName}: ${id}`, caller, caller.ip);
        wsSyncServer.broadcast({ type: 'sync:mutation', entity: collectionName, action: 'update', data: updatedItem, sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
        return res.json({ success: true, item: updatedItem });
      } else {
        return res.status(400).json({ error: `Collection ${collectionName} n'est pas une liste` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/data/:collection/:id", (req, res) => {
    const collectionName = req.params.collection as any;
    const id = req.params.id;
    const caller = getCallerUser(req);

    if (caller.role === 'secretary') {
      if (collectionName === 'patients') return res.status(403).json({ error: "Permission refusée : Seul le médecin est autorisé à supprimer un dossier patient." });
      if (['consultations', 'prescriptions'].includes(collectionName)) return res.status(403).json({ error: "Permission refusée : Seul le médecin peut supprimer un acte médical." });
      if (['users', 'accounting'].includes(collectionName)) return res.status(403).json({ error: "Action réservée au médecin administrateur." });
    }

    try {
      const current = centralDb.getCollection<any[]>(collectionName);
      if (Array.isArray(current)) {
        const filtered = current.filter((it) => it.id !== id);
        if (filtered.length === current.length) return res.status(404).json({ error: `Élément avec l'ID ${id} introuvable` });

        centralDb.setCollection(collectionName, filtered);
        centralDb.addAuditLog(`DELETE_${collectionName.toUpperCase()}`, `Suppression dans ${collectionName}: ${id}`, caller, caller.ip);
        wsSyncServer.broadcast({ type: 'sync:mutation', entity: collectionName, action: 'delete', data: { id }, sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
        return res.json({ success: true, deletedId: id });
      } else {
        return res.status(400).json({ error: `Collection ${collectionName} non compatible` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. BACKUP & RESTORE
  // ==========================================

  app.get("/api/backup/export", (_req, res) => {
    const data = centralDb.getFullData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="medicab_central_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(data, null, 2));
  });

  app.post("/api/backup/restore", (req, res) => {
    const caller = getCallerUser(req);
    if (caller.role !== 'admin' && caller.role !== 'doctor') return res.status(403).json({ error: "Restauration réservée au médecin administrateur." });

    const incoming = req.body;
    if (!incoming || typeof incoming !== 'object') return res.status(400).json({ error: "Données de sauvegarde invalides" });

    try {
      centralDb.createBackup("pre_restore");
      centralDb.importFromMigration(incoming);
      centralDb.addAuditLog("RESTORE_CENTRAL_DB", "Restauration intégrale de la base centrale effectuée", caller, caller.ip);
      wsSyncServer.broadcast({ type: 'sync:full', action: 'refresh', sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
      res.json({ success: true, message: "Base centrale restaurée avec succès" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/migrate/import-local", (req, res) => {
    const caller = getCallerUser(req);
    const localData = req.body;
    if (!localData) return res.status(400).json({ error: "Données locales manquantes" });

    try {
      const result = centralDb.importFromMigration(localData);
      centralDb.addAuditLog("MIGRATE_LOCAL_DATA", "Importation et fusion des données locales vers la base centrale", caller, caller.ip);
      wsSyncServer.broadcast({ type: 'sync:full', action: 'refresh', sender: { userId: caller.id, userName: caller.fullName, role: caller.role } });
      res.json({ success: true, stats: result.stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite / Static files setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const possiblePaths = [
      __dirname,
      path.join(__dirname, "dist"),
      path.join(process.cwd(), "dist"),
      process.cwd(),
      (process as any).resourcesPath ? path.join((process as any).resourcesPath, "app", "dist") : "",
      (process as any).resourcesPath ? path.join((process as any).resourcesPath, "dist") : "",
    ].filter(Boolean);

    let distPath = path.join(process.cwd(), "dist");
    for (const p of possiblePaths) {
      if (fs.existsSync(path.join(p, "index.html"))) {
        distPath = p;
        break;
      }
    }

    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const targetIndex = path.join(distPath, "index.html");
      if (fs.existsSync(targetIndex)) {
        res.sendFile(targetIndex);
      } else {
        res.status(500).send("Dossier d'actifs introuvable : " + distPath);
      }
    });
  }

  return new Promise((resolve, reject) => {
    const httpServer = http.createServer(app);
    wsSyncServer.initialize(httpServer);

    httpServer.listen(activePort, "0.0.0.0", () => {
      const primaryIp = getPrimaryLocalIp();
      console.log(`====================================================`);
      console.log(`[MediCab Central Server] Running on port ${activePort}`);
      console.log(`[LAN Address] Accessible on: http://${primaryIp}:${activePort}`);
      console.log(`====================================================`);
      resolve(httpServer);
    });

    httpServer.on("error", (err) => {
      console.error("Server listen error:", err);
      reject(err);
    });
  });
}

// التشييك المباشر للتشغيل المستقل فقط دون تكرار
if (require.main === module) {
  startServer().catch((err) => {
    console.error("Fatal server error on startup:", err);
  });
}