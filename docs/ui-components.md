# VeriPlan UI Components

This document outlines the core UI components available in the VeriPlan design system.

## Button

The Button component is used for actions in forms, dialogs, and more.

### Usage

```jsx
import Button from '../components/Button/Button';

function Example() {
  return (
    <>
      <Button>Default Button</Button>
      <Button variant="primary" size="large">Primary Large</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="text">Text Button</Button>
      <Button disabled>Disabled</Button>
      <Button fullWidth>Full Width</Button>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'outline' \| 'text' | 'primary' | The button style variant |
| size | 'small' \| 'medium' \| 'large' | 'medium' | The size of the button |
| disabled | boolean | false | Whether the button is disabled |
| fullWidth | boolean | false | Whether the button takes up the full width |
| onClick | function | - | Function called when button is clicked |
| type | 'button' \| 'submit' \| 'reset' | 'button' | HTML button type |
| className | string | '' | Additional CSS class names |

## Adding New Components

When adding new components to the design system:

1. Create a new directory under `/src/components/`
2. Include the component JSX file, CSS file, and tests
3. Document the component in this file
4. Add usage examples
