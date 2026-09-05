import { Type } from '@angular/core';

/**
 * Target-Core signature (9.x): getComponentFactory() was renamed to
 * getComponentType() and now returns Type<any> instead of ComponentFactory<any>.
 */
export class InfoFieldFactory {
  getComponentType(): Type<any> {
    return Object as unknown as Type<any>;
  }
}
