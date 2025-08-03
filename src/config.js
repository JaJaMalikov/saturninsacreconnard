const params = new URLSearchParams(window.location.search);

export const CONFIG = {
  SVG_URL: params.get('svg') || 'assets/pantins/manu.svg',
  THEATRE_ID: params.get('theatre') || 'theatre',
  PANTIN_ROOT_ID: params.get('root') || 'manu_test',
  GRAB_ID: params.get('grab') || 'torse'
};

export default CONFIG;
