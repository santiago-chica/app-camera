import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { IPhotoItem } from '../types/IPhotoItem';

@Injectable({
  providedIn: 'root',
})
export class PhotoDbService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;
  private readonly dbName = 'photo_db';

  private async _createTable() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        caption TEXT,
        imagePath TEXT NOT NULL,
        photoDate TEXT NOT NULL,
        isFavorite INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async init() {
    const consistency = await this.sqlite.checkConnectionsConsistency();
    const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;

    if (consistency.result && isConn) {
      this.db = await this.sqlite.retrieveConnection(this.dbName, false);
    } else {
      this.db = await this.sqlite.createConnection(this.dbName, false, 'no-encryption', 1, false);
    }

    await this.db.open();

    await this._createTable();
  }

  async getPhotoById(id: number): Promise<IPhotoItem | null> {
    const res = await this.db.query('SELECT * FROM photos WHERE id = ?;', [id]);
    if (!res.values || res.values.length === 0) return null;
    const row = res.values[0];
    return {
      id: row.id,
      title: row.title,
      caption: row.caption,
      imagePath: row.imagePath,
      photoDate: row.photoDate,
      isFavorite: !!row.isFavorite
    };
  }

  async toggleFavorite(id: number) {
    const photo = await this.getPhotoById(id);
    if (!photo) return;

    await this.updatePhoto({ ...photo, isFavorite: !photo.isFavorite });
  }

  async savePhoto(photo: IPhotoItem) {
    const { title, caption, imagePath, photoDate, isFavorite } = photo;

    await this.db.run(`
      INSERT INTO photos (title, caption, imagePath, photoDate, isFavorite)
      VALUES (?, ?, ?, ?, ?);
    `, [
      title, caption || null,
      imagePath,
      photoDate,
      isFavorite ? 1 : 0
    ]);
  }

  async getPhotos(): Promise<IPhotoItem[]> {
    const res = await this.db.query('SELECT * FROM photos ORDER BY id DESC;');
    return (res.values?.map((row: any) => ({
      id: row.id,
      title: row.title,
      caption: row.caption,
      imagePath: row.imagePath,
      photoDate: row.photoDate,
      isFavorite: !!row.isFavorite
    })) || []) as IPhotoItem[];
  }

  async deletePhoto(id: number) {
    await this.db.run('DELETE FROM photos WHERE id = ?;', [id]);
  }

  async updatePhoto(photo: IPhotoItem) {
    const { id, title, caption, imagePath, photoDate, isFavorite } = photo;
    if (!id) throw new Error('Photo ID is required for update.');

    await this.db.run(`
      UPDATE photos
      SET title = ?, caption = ?, imagePath = ?, photoDate = ?, isFavorite = ?
      WHERE id = ?;
    `, [
      title, caption || null,
      imagePath,
      photoDate,
      isFavorite ? 1 : 0,
      id
    ]);
  }

  
}
