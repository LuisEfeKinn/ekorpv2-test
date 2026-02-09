import { RHFCode } from './rhf-code';
import { RHFRating } from './rhf-rating';
import { RHFEditor } from './rhf-editor';
import { RHFSlider } from './rhf-slider';
import { RHFTextField } from './rhf-text-field';
import { RHFRadioGroup } from './rhf-radio-group';
import { RHFPhoneInput } from './rhf-phone-input';
import { RHFNumberInput } from './rhf-number-input';
import { RHFAutocomplete } from './rhf-autocomplete';
import { RHFCountrySelect } from './rhf-country-select';
import { RHFSelect, RHFMultiSelect } from './rhf-select';
import { RHFSwitch, RHFMultiSwitch } from './rhf-switch';
import { SkillAutocomplete } from './rhf-skill-autocomplete';
import { RegionAutocomplete } from './rhf-region-autocomplete';
import { RHFCheckbox, RHFMultiCheckbox } from './rhf-checkbox';
import { CountryAutocomplete } from './rhf-country-autocomplete';
import { PositionAutocomplete } from './rhf-position-autocomplete';
import { RHFUpload, RHFUploadBox, RHFUploadAvatar } from './rhf-upload';
import { MunicipalityAutocomplete } from './rhf-municipality-autocomplete';
import { EmploymentTypeAutocomplete } from './rhf-employment-type-autocomplete';
import { RHFDatePicker, RHFTimePicker, RHFDateTimePicker } from './rhf-date-picker';
import { OrganizationalUnitAutocomplete } from './rhf-organizational-unit-autocomplete';

// ----------------------------------------------------------------------

export const Field = {
  Code: RHFCode,
  Editor: RHFEditor,
  Select: RHFSelect,
  Upload: RHFUpload,
  Switch: RHFSwitch,
  Slider: RHFSlider,
  Rating: RHFRating,
  Text: RHFTextField,
  Phone: RHFPhoneInput,
  Checkbox: RHFCheckbox,
  UploadBox: RHFUploadBox,
  RadioGroup: RHFRadioGroup,
  NumberInput: RHFNumberInput,
  MultiSelect: RHFMultiSelect,
  MultiSwitch: RHFMultiSwitch,
  UploadAvatar: RHFUploadAvatar,
  Autocomplete: RHFAutocomplete,
  MultiCheckbox: RHFMultiCheckbox,
  CountrySelect: RHFCountrySelect,
  // Pickers
  DatePicker: RHFDatePicker,
  TimePicker: RHFTimePicker,
  DateTimePicker: RHFDateTimePicker,
  // Autocompletes
  CountryAutocomplete,
  RegionAutocomplete,
  MunicipalityAutocomplete,
  PositionAutocomplete,
  EmploymentTypeAutocomplete,
  SkillAutocomplete,
  OrganizationalUnitAutocomplete,
};
