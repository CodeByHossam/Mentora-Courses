module.exports = function (schema) {
/* =========================================================
   VIRTUAL FIELDS
   
   Computed properties that are not stored in the database
   but calculated dynamically when accessed.
========================================================= */

// Virtual for associated lessons
schema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "course",
  justOne: false,
});

// Virtual for calculated average rating
schema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0;

  const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
  const average = sum / this.ratings.length;

  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
});

// Virtual for total ratings count
schema.virtual("ratingsCount").get(function () {
  return this.ratings ? this.ratings.length : 0;
});

// Virtual for total likes count
schema.virtual("likesCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for total course duration (calculated from lessons)
schema.virtual("totalDuration").get(function () {
  if (!this.lessons || this.lessons.length === 0) return "0m";

  // Calculate total duration from populated lessons
  const totalMinutes = this.lessons.reduce((acc, lesson) => {
    if (typeof lesson === "object" && lesson.duration) {
      return acc + (typeof lesson.duration === "number" ? lesson.duration : 0);
    }
    return acc;
  }, 0);

  // Format duration as "Xh Ym" or "Ym"
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

// Virtual for lesson count
schema.virtual("lessonCount").get(function () {
  return this.lessons ? this.lessons.length : 0;
});

// Virtual for final price after discount
schema.virtual("finalPrice").get(function () {
  if (this.isFree) return 0;

  const discount = this.discountPercentage || 0;
  const discountAmount = (this.price * discount) / 100;
  const finalPrice = this.price - discountAmount;

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
});
};
