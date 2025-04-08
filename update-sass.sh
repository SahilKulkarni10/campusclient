#!/bin/bash

# Find all SCSS files with @import
scss_files=$(grep -l "@import \"../../responsive.scss\"" --include="*.scss" -r ./src)

# Replace @import with @use
for file in $scss_files; do
  echo "Updating $file"
  sed -i '' 's/@import "..\/..\/responsive.scss";/@use "..\/..\/responsive" as *;/g' "$file"
done

# Find files with color functions like darken
color_files=$(grep -l "darken\|lighten" --include="*.scss" -r ./src)

# Update files with color functions, adding the color module
for file in $color_files; do
  echo "Adding color module to $file"
  # Only add the import if it doesn't exist
  if ! grep -q "@use \"sass:color\"" "$file"; then
    sed -i '' '1s/^/@use "sass:color";\n/' "$file"
  fi
  
  # Replace darken function
  sed -i '' 's/darken(\([^,]*\), \([^)]*\))/color.scale(\1, $lightness: -\2)/g' "$file"
  
  # Replace lighten function
  sed -i '' 's/lighten(\([^,]*\), \([^)]*\))/color.scale(\1, $lightness: \2)/g' "$file"
done

echo "Sass updates completed!" 