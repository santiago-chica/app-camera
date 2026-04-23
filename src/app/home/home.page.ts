import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';
import { Camera, EncodingType } from '@capacitor/camera';
import PhotoType from '../types/PhotoType';

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
import { add, trash } from 'ionicons/icons';

import { AlertController } from '@ionic/angular/standalone';

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
export class HomePage {
  photos: PhotoType[] = [];

  constructor(
    private storage: Storage,
    private alertController: AlertController,
  ) {
    addIcons({
      add, trash
    });
  }

  async ngOnInit() {
    await this.storage.create();
    const storedPhotos = await this.storage.get('photos');
    if (storedPhotos) {
      this.photos = storedPhotos;
    }
  }

  async saveToStorage(photo: PhotoType) {
    this.photos.push(photo);
    await this.storage.set('photos', this.photos);
  }

  async removePhoto(index: number) {
    this.photos.splice(index, 1);
    await this.storage.set('photos', this.photos);
  }

  async takePicture() {
    const image = await Camera.takePhoto({
      quality: 90,
      editable: 'no',
      encodingType: EncodingType.PNG,
    });

    if (!image || !image.webPath) {
      console.error('No se pudo tomar la foto o no se obtuvo la ruta web.');
      return;
    }

    await this.alertInfo('data:image/png;base64, ' + image.thumbnail);
  }

  async alertInfo(photo: string) {
    const alert = await this.alertController.create({
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
            const newPhoto: PhotoType = {
              image: photo,
              date: new Date().toDateString(),
              caption: data.caption || 'Sin descripción',
              title: data.title || 'Sin título',
            };
            this.saveToStorage(newPhoto);
          },
        },
      ],
    });

    await alert.present();
  }
}
