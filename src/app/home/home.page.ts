import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { Camera, EncodingType } from '@capacitor/camera';

import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonButton
} from '@ionic/angular/standalone';

import { Storage } from '@ionic/storage-angular';

import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { add, trash, heart, heartOutline } from 'ionicons/icons';

import { AlertController } from '@ionic/angular/standalone';
import { PhotoDbService } from '../services/photo-db.service';
import { IPhotoItem } from '../types/IPhotoItem';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButton
  ],
})
export class HomePage implements OnInit{
  photos: IPhotoItem[] = [];

  constructor(
    private _storage: Storage,
    private _alertController: AlertController,
    private _photoDbService: PhotoDbService
  ) {
    addIcons({
      add, trash, heart, heartOutline
    });
  }


  async ngOnInit() {
    await this._photoDbService.init();
    await this.loadPhotos();
  }

  async saveToStorage(photo: IPhotoItem) {
    await this._photoDbService.savePhoto(photo);
    await this.loadPhotos();
  }

  async removePhoto(id: number) {
    await this._photoDbService.deletePhoto(id);
    await this.loadPhotos();
  }

  async toggleFavorite(id: number) {
    await this._photoDbService.toggleFavorite(id);
    await this.loadPhotos();
  }

  async takePicture() {
    const image = await Camera.takePhoto({
      quality: 90,
      editable: 'no',
      encodingType: EncodingType.JPEG,
    });

    if (!image || !image.webPath) {
      console.error('No se pudo tomar la foto o no se obtuvo la ruta.');
      return;
    }

    const response = await fetch(image.webPath);
    const blob = await response.blob();

    const fileName = 'photo_' + new Date().getTime() + '.jpeg';

    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result as string;

      const file = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      const displayPath = Capacitor.convertFileSrc(file.uri);

      await this.alertInfo(displayPath);
    };
    reader.readAsDataURL(blob);
  }

  async loadPhotos() {
    this.photos = await this._photoDbService.getPhotos();
  }

  async alertInfo(photoUri: string) {
    const alert = await this._alertController.create({
      header: 'Nueva foto',
      message: 'Coloque la información de la foto en el campo de texto',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Título de la foto',
        },
        {
          name: 'caption',
          type: 'text',
          placeholder: 'Descripción de la foto',
        },
      ],

      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Guardar',
          handler: (data) => {
            const newPhoto: IPhotoItem = {
              title: data.title || 'Sin título',
              caption: data.caption || 'Sin descripción',
              imagePath: photoUri,
              photoDate: new Date().toDateString(),
              isFavorite: false,
            };
            this.saveToStorage(newPhoto);
          },
        },
      ],
    });

    await alert.present();
  }
}
