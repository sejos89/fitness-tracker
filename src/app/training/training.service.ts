import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Subject } from 'rxjs';
import { debounceTime, map, takeUntil } from 'rxjs/operators';
import { UIService } from '../shared/ui.service';
import { Exercise } from './exercise.model';

@Injectable({ providedIn: 'root' })
export class TrainingService {
  exerciseChanged: Subject<Exercise> = new Subject();
  exercisesChanged: Subject<Exercise[]> = new Subject();
  finishedExercisesChanged: Subject<Exercise[]> = new Subject();
  private availableExercises: Exercise[] = [];
  public userId;
  private runningExercise: Exercise;
  private unsubscribe: Subject<void> = new Subject();

  constructor(
    private readonly db: AngularFirestore,
    private uiService: UIService,
    private afAuth: AngularFireAuth
  ) {}
  fetchAvailableExercises() {
    this.uiService.loadingStateChanged.next(true);
    this.db
      .collection('available exercises')
      .snapshotChanges()
      .pipe(
        takeUntil(this.unsubscribe),
        map((docArray) =>
          docArray.map((doc) => {
            return {
              id: doc.payload.doc.id,
              name: doc.payload.doc.data()['name'],
              calories: doc.payload.doc.data()['calories'],
              duration: doc.payload.doc.data()['duration'],
              url: doc.payload.doc.data()['url'],
            };
          })
        )
      )
      .subscribe(
        (exercises: Exercise[]) => {
          this.uiService.loadingStateChanged.next(false);
          this.availableExercises = exercises;
          this.exercisesChanged.next([...this.availableExercises]);
        },
        (error) => {
          this.uiService.loadingStateChanged.next(false);
          this.uiService.showSnackbar(
            'Fetching Exercises failed, please try again later',
            null,
            3000
          );
          this.exercisesChanged.next(null);
        }
      );
  }

  startExercise(selectedId: string) {
    this.runningExercise = this.availableExercises.find(
      (ex) => ex.id === selectedId
    );
    this.exerciseChanged.next({ ...this.runningExercise });
  }

  completeExercise() {
    this.addDataToDatabase({
      ...this.runningExercise,
      date: new Date(),
      state: 'completed',
      userId: this.userId,
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  cancelExercise(progress: number) {
    this.addDataToDatabase({
      ...this.runningExercise,
      duration: this.runningExercise.duration * (progress / 100),
      calories: this.runningExercise.calories * (progress / 100),
      date: new Date(),
      state: 'cancelled',
      userId: this.userId,
    });
    this.runningExercise = null;
    this.exerciseChanged.next(null);
  }

  fetchCompletedOrCancelledExercises() {
    //TODO arreglar la acumulacion de subscripciones
    console.log('hola desde fetchcomplete');
    // if (!this.fbSubs) {
    this.db
      .collection('finishedExercises', (ref) =>
        ref.where('userId', '==', this.userId)
      )
      .valueChanges()
      // .pipe(debounceTime(500))
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((exercises: Exercise[]) => {
        console.log('hola desde fetchcomplete subs');
        this.finishedExercisesChanged.next(exercises);
      });
    // }
  }

  getRunningExercise() {
    return { ...this.runningExercise };
  }

  private addDataToDatabase(exercise: Exercise) {
    this.db.collection('finishedExercises').add(exercise);
  }

  cancelSubscriptions() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    console.log('desuscribiendooo');
  }
}
