import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetUpGameConfigurationComponent } from './set-up-game-configuration.component';

describe('SetUpGameConfigurationComponent', () => {
  let component: SetUpGameConfigurationComponent;
  let fixture: ComponentFixture<SetUpGameConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetUpGameConfigurationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetUpGameConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
