import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('mentors')
  @ApiOperation({ summary: 'Search mentors (public)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', enum: ['rating', 'price', 'sessions', 'reviews'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  searchMentors(
    @Query('category') category?: string,
    @Query('minRating') minRating?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'rating' | 'price' | 'sessions' | 'reviews',
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.marketplaceService.searchMentors({
      category,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      sortBy,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('mentors/featured')
  @ApiOperation({ summary: 'Get featured mentors' })
  @ApiQuery({ name: 'limit', required: false })
  getFeaturedMentors(@Query('limit') limit?: string) {
    return this.marketplaceService.getFeaturedMentors(limit ? parseInt(limit) : 6);
  }

  @Get('mentors/:id')
  @ApiOperation({ summary: 'Get mentor profile (public)' })
  getMentorProfile(@Param('id') id: string) {
    return this.marketplaceService.getMentorProfile(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories() {
    return this.marketplaceService.getCategories();
  }
}
